import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useSimulation } from '../hooks/useSimulation';
import { computeGraphData, GraphNode, GraphLink } from '../utils/dependencyGraphData';
import { 
  Network, Play, RefreshCw, ZoomIn, ZoomOut, Maximize2, 
  Clock, ShieldAlert, Sparkles, Layers, Sliders, CheckCircle2,
  AlertTriangle, ArrowRight, UserCheck, Search, Filter, Info, X
} from 'lucide-react';
import { cn } from '../lib/utils';

export function AgentDependencyGraph({ className }: { className?: string }) {
  const { activeWorkRequest, activeAgents, openAgentConfigModal, selectAgentForLogs } = useSimulation();
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [layoutMode, setLayoutMode] = useState<'pipeline' | 'force'>('pipeline');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [filterOnlyWaiting, setFilterOnlyWaiting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const appState = activeWorkRequest?.status || 'NEW';

  // Compute graph nodes & links based on current simulation state
  const { nodes: rawNodes, links: rawLinks, waitingPairs } = useMemo(() => {
    return computeGraphData(appState, activeAgents);
  }, [appState, activeAgents]);

  // Filtered dataset
  const { nodes, links } = useMemo(() => {
    let nList = [...rawNodes];
    let lList = [...rawLinks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      nList = nList.filter(n => n.name.toLowerCase().includes(q) || n.role.toLowerCase().includes(q));
      const validIds = new Set(nList.map(n => n.id));
      lList = lList.filter(l => {
        const s = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
        return validIds.has(s) && validIds.has(t);
      });
    }

    if (filterOnlyWaiting) {
      lList = lList.filter(l => l.isWaiting);
      const waitingNodeIds = new Set<string>();
      lList.forEach(l => {
        const s = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source as string;
        const t = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target as string;
        waitingNodeIds.add(s);
        waitingNodeIds.add(t);
      });
      nList = nList.filter(n => waitingNodeIds.has(n.id) || n.status === 'waiting' || n.status === 'working');
    }

    return { nodes: nList, links: lList };
  }, [rawNodes, rawLinks, searchQuery, filterOnlyWaiting]);

  // Selected Node
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[0] || null;
  }, [nodes, selectedNodeId]);

  // D3 Render Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 580;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Setup SVG Root and Zoom Container
    svg.attr('width', width).attr('height', height);

    // Filters and Markers Defs
    const defs = svg.append('defs');

    // Glow Filters
    const createGlowFilter = (id: string, color: string) => {
      const filter = defs.append('filter')
        .attr('id', id)
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
      
      filter.append('feGaussianBlur')
        .attr('stdDeviation', '4')
        .attr('result', 'coloredBlur');

      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    };

    createGlowFilter('glow-working', '#22c55e');
    createGlowFilter('glow-waiting', '#f59e0b');
    createGlowFilter('glow-completed', '#06b6d4');
    createGlowFilter('glow-active', '#a855f7');

    // Arrow Markers
    const createMarker = (id: string, color: string) => {
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 38)
        .attr('refY', 0)
        .attr('markerWidth', 7)
        .attr('markerHeight', 7)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    };

    createMarker('arrow-active', '#3b82f6');
    createMarker('arrow-waiting', '#f59e0b');
    createMarker('arrow-idle', '#475569');
    createMarker('arrow-completed', '#06b6d4');

    // Zoom Layer
    const zoomGroup = svg.append('g').attr('class', 'zoom-layer');

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform);
      });

    svg.call(zoomBehavior as any);

    // Calculate node coordinates based on layoutMode
    if (layoutMode === 'pipeline') {
      const stages = [
        { key: 'plan', label: '1. PLAN & INTENT' },
        { key: 'review', label: '2. AUDIT & CRITIQUE' },
        { key: 'spec', label: '3. ARCHITECTURE SPEC' },
        { key: 'exec', label: '4. CODE BUILD & ENG' },
        { key: 'validate', label: '5. QA VALIDATION' },
        { key: 'governance', label: '6. COMPLIANCE & LOGS' }
      ];

      const colWidth = (width - 120) / stages.length;
      const startX = 70;

      // Draw Pipeline Stage Background Columns
      stages.forEach((s, idx) => {
        const x = startX + idx * colWidth;
        zoomGroup.append('rect')
          .attr('x', x - colWidth / 2 + 10)
          .attr('y', 20)
          .attr('width', colWidth - 20)
          .attr('height', height - 40)
          .attr('rx', 12)
          .attr('fill', '#090d16')
          .attr('stroke', '#1e293b')
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.6);

        zoomGroup.append('text')
          .attr('x', x)
          .attr('y', 42)
          .attr('text-anchor', 'middle')
          .attr('fill', '#64748b')
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .attr('letter-spacing', '1px')
          .text(s.label);
      });

      // Group nodes by stage
      const stageMap = new Map<string, GraphNode[]>();
      nodes.forEach(n => {
        const list = stageMap.get(n.stage) || [];
        list.push(n);
        stageMap.set(n.stage, list);
      });

      stages.forEach((s, sIdx) => {
        const stageNodes = stageMap.get(s.key) || [];
        const x = startX + sIdx * colWidth;
        const total = stageNodes.length;
        const startY = 100;
        const spacingY = total > 1 ? Math.min(140, (height - 180) / total) : 0;

        stageNodes.forEach((node, nIdx) => {
          node.x = x;
          node.y = total === 1 ? height / 2 : startY + nIdx * spacingY + 40;
        });
      });
    } else {
      // Force Physics Layout
      const simulation = d3.forceSimulation<GraphNode>(nodes)
        .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(140))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide(65));

      simulation.on('tick', () => {
        updatePositions();
      });
    }

    // Prepare Links
    const linkGroup = zoomGroup.append('g').attr('class', 'links-layer');

    const linkSelection = linkGroup.selectAll<SVGPathElement, GraphLink>('path.link')
      .data(links, (d: any) => d.id)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke-width', (d: GraphLink) => d.isWaiting ? 2.5 : d.status === 'active' ? 2 : 1.5)
      .attr('stroke', (d: GraphLink) => {
        if (d.isWaiting) return '#f59e0b';
        if (d.status === 'active') return '#3b82f6';
        if (d.status === 'completed') return '#06b6d4';
        return '#334155';
      })
      .attr('stroke-dasharray', (d: GraphLink) => d.isWaiting ? '6,4' : 'none')
      .attr('marker-end', (d: GraphLink) => {
        if (d.isWaiting) return 'url(#arrow-waiting)';
        if (d.status === 'active') return 'url(#arrow-active)';
        if (d.status === 'completed') return 'url(#arrow-completed)';
        return 'url(#arrow-idle)';
      });

    // Link Labels (Artifact names & Waiting warnings)
    const linkLabelGroup = zoomGroup.append('g').attr('class', 'link-labels-layer');

    const linkLabelSelection = linkLabelGroup.selectAll<SVGGElement, GraphLink>('g.link-label-group')
      .data(links, (d: any) => d.id)
      .enter()
      .append('g')
      .attr('class', 'link-label-group');

    // Label Background Rect
    linkLabelSelection.append('rect')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('padding', '2px')
      .attr('fill', (d: GraphLink) => d.isWaiting ? '#451a03' : '#0f172a')
      .attr('stroke', (d: GraphLink) => d.isWaiting ? '#d97706' : '#1e293b')
      .attr('stroke-width', 1);

    // Label Text
    linkLabelSelection.append('text')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '600')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', (d: GraphLink) => d.isWaiting ? '#fbbf24' : d.status === 'active' ? '#60a5fa' : '#94a3b8')
      .text((d: GraphLink) => d.isWaiting ? `⏳ WAITING FOR ${d.label.toUpperCase()}` : d.label);

    // Prepare Nodes
    const nodeGroup = zoomGroup.append('g').attr('class', 'nodes-layer');

    const nodeSelection = nodeGroup.selectAll<SVGGElement, GraphNode>('g.node')
      .data(nodes, (d: any) => d.id)
      .enter()
      .append('g')
      .attr('class', 'node cursor-pointer')
      .on('click', (event: MouseEvent, d: GraphNode) => {
        event.stopPropagation();
        setSelectedNodeId(d.id);
      })
      .on('mouseover', (event: MouseEvent, d: GraphNode) => setHoveredNodeId(d.id))
      .on('mouseout', () => setHoveredNodeId(null));

    // Drag behavior for nodes
    const dragBehavior = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event: any, d: GraphNode) => {
        if (layoutMode === 'force') {
          if (!event.active) d3.forceSimulation(nodes).alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }
      })
      .on('drag', (event: any, d: GraphNode) => {
        d.x = event.x;
        d.y = event.y;
        if (layoutMode === 'force') {
          d.fx = event.x;
          d.fy = event.y;
        }
        updatePositions();
      })
      .on('end', (event: any, d: GraphNode) => {
        if (layoutMode === 'force' && !event.active) {
          d.fx = null;
          d.fy = null;
        }
      });

    nodeSelection.call(dragBehavior as any);

    // Node Outer Pulse Ring (for Working & Waiting)
    nodeSelection.each(function(d: GraphNode) {
      const g = d3.select(this);
      
      if (d.status === 'working') {
        g.append('circle')
          .attr('r', 28)
          .attr('fill', 'none')
          .attr('stroke', '#22c55e')
          .attr('stroke-width', 2)
          .attr('opacity', 0.6)
          .attr('filter', 'url(#glow-working)')
          .append('animate')
          .attr('attributeName', 'r')
          .attr('values', '26;34;26')
          .attr('dur', '2s')
          .attr('repeatCount', 'indefinite');
      } else if (d.status === 'waiting') {
        g.append('circle')
          .attr('r', 28)
          .attr('fill', 'none')
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 2)
          .attr('opacity', 0.8)
          .attr('filter', 'url(#glow-waiting)')
          .append('animate')
          .attr('attributeName', 'r')
          .attr('values', '26;32;26')
          .attr('dur', '1.5s')
          .attr('repeatCount', 'indefinite');
      }
    });

    // Node Main Base Circle
    nodeSelection.append('circle')
      .attr('r', 24)
      .attr('fill', '#0f172a')
      .attr('stroke', (d: GraphNode) => {
        if (d.status === 'working') return '#22c55e';
        if (d.status === 'waiting') return '#f59e0b';
        if (d.status === 'completed') return '#06b6d4';
        return '#334155';
      })
      .attr('stroke-width', (d: GraphNode) => (d.id === selectedNodeId ? 3.5 : 2));

    // Avatar Thumbnail Clipping Mask
    nodes.forEach(n => {
      const clipId = `avatar-clip-${n.id}`;
      if (!defs.select(`#${clipId}`).node()) {
        defs.append('clipPath')
          .attr('id', clipId)
          .append('circle')
          .attr('r', 21)
          .attr('cx', 0)
          .attr('cy', 0);
      }
    });

    // Avatar Image
    nodeSelection.append('image')
      .attr('href', (d: GraphNode) => d.avatarUrl || '')
      .attr('x', -21)
      .attr('y', -21)
      .attr('width', 42)
      .attr('height', 42)
      .attr('clip-path', (d: GraphNode) => `url(#avatar-clip-${d.id})`)
      .attr('preserveAspectRatio', 'xMidYMid slice');

    // Node Name Label Below
    nodeSelection.append('text')
      .attr('y', 36)
      .attr('text-anchor', 'middle')
      .attr('fill', (d: GraphNode) => d.id === selectedNodeId ? '#f8fafc' : '#e2e8f0')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .text((d: GraphNode) => d.name);

    // Node Role Badge Text
    nodeSelection.append('text')
      .attr('y', 48)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-family', 'sans-serif')
      .text((d: GraphNode) => d.role);

    // Status Pill Badge Above Node
    const badgeGroup = nodeSelection.append('g').attr('transform', 'translate(0, -32)');

    badgeGroup.append('rect')
      .attr('x', -32)
      .attr('y', -8)
      .attr('width', 64)
      .attr('height', 16)
      .attr('rx', 8)
      .attr('fill', (d: GraphNode) => {
        if (d.status === 'working') return '#14532d';
        if (d.status === 'waiting') return '#78350f';
        if (d.status === 'completed') return '#164e63';
        return '#1e293b';
      })
      .attr('stroke', (d: GraphNode) => {
        if (d.status === 'working') return '#22c55e';
        if (d.status === 'waiting') return '#f59e0b';
        if (d.status === 'completed') return '#06b6d4';
        return '#475569';
      })
      .attr('stroke-width', 1);

    badgeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '3px')
      .attr('font-size', '8px')
      .attr('font-weight', '800')
      .attr('letter-spacing', '0.5px')
      .attr('fill', (d: GraphNode) => {
        if (d.status === 'working') return '#4ade80';
        if (d.status === 'waiting') return '#fbbf24';
        if (d.status === 'completed') return '#22d3ee';
        return '#94a3b8';
      })
      .text((d: GraphNode) => {
        if (d.status === 'working') return '⚡ WORKING';
        if (d.status === 'waiting') return '⏳ WAITING';
        if (d.status === 'completed') return '✓ READY';
        return 'IDLE';
      });

    // Helper function to update node & link SVG positions
    function updatePositions() {
      linkSelection.attr('d', (d: GraphLink) => {
        const source = d.source as GraphNode;
        const target = d.target as GraphNode;
        if (!source || !target || source.x === undefined || target.x === undefined) return '';

        // Smooth curved horizontal/bezier link
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const cx1 = source.x + dx * 0.5;
        const cy1 = source.y;
        const cx2 = source.x + dx * 0.5;
        const cy2 = target.y;

        return `M ${source.x},${source.y} C ${cx1},${cy1} ${cx2},${cy2} ${target.x},${target.y}`;
      });

      linkLabelSelection.attr('transform', (d: GraphLink) => {
        const source = d.source as GraphNode;
        const target = d.target as GraphNode;
        if (!source || !target || source.x === undefined || target.x === undefined) return '';

        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        return `translate(${midX}, ${midY})`;
      });

      linkLabelSelection.select('rect').each(function(this: SVGRectElement) {
        const parent = this.parentNode as SVGGElement | null;
        if (!parent) return;
        const group = d3.select(parent);
        const textNode = group.select('text').node() as SVGTextElement | null;
        if (textNode) {
          const bbox = textNode.getBBox();
          d3.select(this)
            .attr('x', bbox.x - 6)
            .attr('y', bbox.y - 3)
            .attr('width', bbox.width + 12)
            .attr('height', bbox.height + 6);
        }
      });

      nodeSelection.attr('transform', (d: GraphNode) => `translate(${d.x || 0}, ${d.y || 0})`);
    }

    // Initial update call
    updatePositions();

    // Zoom Controls setup
    (svg.node() as any).__zoomReset = () => {
      svg.transition().duration(500).call(zoomBehavior.transform as any, d3.zoomIdentity);
    };
    (svg.node() as any).__zoomIn = () => {
      svg.transition().duration(300).call(zoomBehavior.scaleBy as any, 1.25);
    };
    (svg.node() as any).__zoomOut = () => {
      svg.transition().duration(300).call(zoomBehavior.scaleBy as any, 0.8);
    };

  }, [nodes, links, layoutMode, selectedNodeId]);

  return (
    <div className={cn("flex flex-col bg-gray-950 rounded-xl border border-gray-800 shadow-2xl overflow-hidden relative", className)}>
      
      {/* Top Controls Header */}
      <div className="bg-gray-900/90 border-b border-gray-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
        
        {/* Title & Phase */}
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-blue-950 border border-blue-800 rounded-lg text-blue-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider">
                Agent Workflow & Task Dependency Graph
              </h3>
              <span className="text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">
                D3.js Directed DAG
              </span>
            </div>
            <p className="text-[11px] text-gray-400 flex items-center space-x-2 mt-0.5">
              <span>LOSM Phase: <strong className="text-blue-400">{appState}</strong></span>
              <span>•</span>
              <span>{activeAgents.length} Active Agents</span>
              {waitingPairs.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1 inline" />
                    {waitingPairs.length} Waiting Dependency {waitingPairs.length === 1 ? 'Link' : 'Links'}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Toolbar & Filter Controls */}
        <div className="flex items-center space-x-2">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search agent..."
              className="bg-gray-950 border border-gray-800 rounded-md pl-8 pr-2.5 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 w-32 sm:w-40"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-gray-500 hover:text-gray-300">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Waiting Button */}
          <button
            onClick={() => setFilterOnlyWaiting(!filterOnlyWaiting)}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-md border transition-all flex items-center space-x-1",
              filterOnlyWaiting
                ? "bg-amber-950 text-amber-300 border-amber-600 shadow-sm"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
            )}
            title="Filter to display only active waiting dependency bottlenecks"
          >
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Waiting Only</span>
          </button>

          {/* Layout Mode Toggle */}
          <div className="flex bg-gray-950 border border-gray-800 rounded-md p-0.5">
            <button
              onClick={() => setLayoutMode('pipeline')}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center space-x-1",
                layoutMode === 'pipeline' ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pipeline DAG</span>
            </button>
            <button
              onClick={() => setLayoutMode('force')}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center space-x-1",
                layoutMode === 'force' ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
              )}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Force Physics</span>
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center space-x-1 bg-gray-800 border border-gray-700 rounded-md p-1">
            <button 
              onClick={() => (svgRef.current as any)?.__zoomIn?.()} 
              className="p-1 hover:bg-gray-700 rounded text-gray-300" 
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => (svgRef.current as any)?.__zoomOut?.()} 
              className="p-1 hover:bg-gray-700 rounded text-gray-300" 
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => (svgRef.current as any)?.__zoomReset?.()} 
              className="p-1 hover:bg-gray-700 rounded text-gray-300" 
              title="Reset Zoom & Pan"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Active Waiting Bottlenecks Banner */}
      {waitingPairs.length > 0 && (
        <div className="bg-amber-950/70 border-b border-amber-800/80 px-4 py-2 flex items-center justify-between text-xs text-amber-200 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="font-bold uppercase text-[10px] tracking-wider text-amber-300">
              Active Waiting Dependencies Highlighted:
            </span>
            <div className="flex flex-wrap gap-2 text-amber-100">
              {waitingPairs.map((pair, idx) => (
                <span key={idx} className="bg-amber-900/80 border border-amber-700 px-2 py-0.5 rounded font-mono text-[11px] flex items-center space-x-1">
                  <strong className="text-amber-300">{pair.waiter}</strong>
                  <span className="text-amber-400 font-bold">⏳ waiting on</span>
                  <strong className="text-amber-300">{pair.supplier}</strong>
                  <span className="text-amber-400">({pair.artifact})</span>
                </span>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-amber-300 font-mono hidden md:inline">
            LOSM Workflow Gate Enforcement
          </span>
        </div>
      )}

      {/* Main Canvas & Inspector Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* SVG Canvas Area */}
        <div ref={containerRef} className="flex-1 h-full w-full relative bg-[#060911]">
          <svg ref={svgRef} className="w-full h-full block" />

          {/* Canvas Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-gray-900/90 backdrop-blur-md border border-gray-800 p-2.5 rounded-lg text-[10px] text-gray-300 space-y-1.5 shadow-xl pointer-events-none">
            <span className="font-bold text-gray-400 uppercase tracking-widest block text-[9px] mb-1">Graph Legend</span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span>Working</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Waiting</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span>Ready</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <span>Idle</span>
              </span>
            </div>
            <div className="pt-1 border-t border-gray-800 flex items-center space-x-3 text-gray-400">
              <span className="flex items-center space-x-1">
                <span className="w-4 h-0.5 bg-amber-500 stroke-dasharray" />
                <span className="text-amber-400 font-bold">Dashed Line = Waiting Link</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-4 h-0.5 bg-blue-500" />
                <span>Solid Line = Active Flow</span>
              </span>
            </div>
          </div>
        </div>

        {/* Selected Node Inspector Drawer Side Panel */}
        {selectedNode && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col p-4 space-y-4 overflow-y-auto shrink-0 shadow-2xl">
            
            {/* Header / Avatar */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={selectedNode.avatarUrl}
                    alt={selectedNode.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-500 shadow-md"
                  />
                  <span className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-gray-900",
                    selectedNode.status === 'working' ? 'bg-green-500 animate-ping' :
                    selectedNode.status === 'waiting' ? 'bg-amber-500 animate-ping' :
                    selectedNode.status === 'completed' ? 'bg-cyan-500' : 'bg-slate-600'
                  )} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-gray-100 truncate">{selectedNode.name}</h4>
                  <p className="text-xs text-purple-400 font-medium truncate">{selectedNode.role}</p>
                  <span className="text-[10px] text-gray-500 font-mono">{selectedNode.model}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-gray-500 hover:text-gray-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Active Task Status */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Task Activity</span>
              <div className={cn(
                "p-3 rounded-lg border text-xs leading-relaxed font-medium space-y-1",
                selectedNode.status === 'working' ? "bg-green-950/40 border-green-800/80 text-green-200" :
                selectedNode.status === 'waiting' ? "bg-amber-950/40 border-amber-800/80 text-amber-200" :
                selectedNode.status === 'completed' ? "bg-cyan-950/40 border-cyan-800/80 text-cyan-200" :
                "bg-gray-950/80 border-gray-800 text-gray-300"
              )}>
                <div className="flex items-center space-x-1.5 font-bold uppercase text-[10px]">
                  {selectedNode.status === 'working' && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                  {selectedNode.status === 'waiting' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                  {selectedNode.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>Status: {selectedNode.status.toUpperCase()}</span>
                </div>
                <p>{selectedNode.activeTask}</p>
              </div>
            </div>

            {/* If Waiting: Explicit Dependency Callout */}
            {selectedNode.status === 'waiting' && selectedNode.waitingReason && (
              <div className="bg-amber-950/60 border border-amber-700/80 p-3 rounded-lg space-y-1 text-xs text-amber-200">
                <div className="flex items-center space-x-1.5 font-bold text-amber-300 text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Waiting Dependency Bottleneck</span>
                </div>
                <p className="text-[11px] leading-normal">{selectedNode.waitingReason}</p>
              </div>
            )}

            {/* Dependencies Summary List */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Agent Network Connections</span>
              
              <div className="space-y-1 text-xs">
                <span className="text-[11px] text-gray-500 font-medium block">Upstream Suppliers (Inputs):</span>
                {links.filter(l => (typeof l.target === 'object' ? (l.target as GraphNode).id : l.target) === selectedNode.id).map(l => {
                  const srcId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source as string;
                  const srcNode = nodes.find(n => n.id === srcId);
                  return (
                    <div key={l.id} className="flex items-center justify-between bg-gray-950 p-2 rounded border border-gray-800">
                      <span className="font-semibold text-purple-300">{srcNode?.name || srcId}</span>
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded">
                        {l.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1 text-xs pt-1">
                <span className="text-[11px] text-gray-500 font-medium block">Downstream Consumers (Outputs):</span>
                {links.filter(l => (typeof l.source === 'object' ? (l.source as GraphNode).id : l.source) === selectedNode.id).map(l => {
                  const tgtId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target as string;
                  const tgtNode = nodes.find(n => n.id === tgtId);
                  return (
                    <div key={l.id} className="flex items-center justify-between bg-gray-950 p-2 rounded border border-gray-800">
                      <span className="font-semibold text-blue-300">{tgtNode?.name || tgtId}</span>
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded">
                        {l.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-gray-800 space-y-2">
              <button
                onClick={() => {
                  selectAgentForLogs(selectedNode.id);
                }}
                className="w-full py-2 bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 text-xs font-semibold rounded-md border border-blue-700/60 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>View Agent Activity Logs</span>
              </button>

              <button
                onClick={() => openAgentConfigModal(selectedNode.id)}
                className="w-full py-2 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 text-xs font-semibold rounded-md border border-purple-700/60 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Configure Agent Persona</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
