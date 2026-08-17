import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useSimulation } from '../hooks/useSimulation';
import { 
  HeatmapDataCell, HeatmapMetricMode, HeatmapTimeGranularity, HeatmapColorPalette,
  ActiveAgent 
} from '../types';
import { 
  generateSessionHeatmapData, getHeatmapMetricValue, formatHeatmapMetricDisplay, HeatmapSessionSummary 
} from '../utils/heatmapDataGenerator';
import { 
  Activity, Zap, Flame, Clock, ShieldAlert, Sparkles, Filter, 
  Layers, Search, RefreshCw, ZoomIn, ZoomOut, RotateCcw, 
  Play, Pause, ChevronRight, Sliders, BarChart3, Database,
  ArrowUpDown, CheckCircle2, AlertTriangle, Download, Copy,
  Info, Cpu, Terminal, Eye, SlidersHorizontal, UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AgentActivityHeatmapProps {
  className?: string;
  onSelectAgent?: (agentId: string) => void;
}

export function AgentActivityHeatmap({ className, onSelectAgent }: AgentActivityHeatmapProps) {
  const { 
    activeAgents, 
    agentLogs, 
    performanceMetrics, 
    openAgentConfigModal, 
    selectAgentForLogs, 
    addToast 
  } = useSimulation();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Heatmap Configuration States
  const [metricMode, setMetricMode] = useState<HeatmapMetricMode>('compute');
  const [granularity, setGranularity] = useState<HeatmapTimeGranularity>('30s');
  const [palette, setPalette] = useState<HeatmapColorPalette>('cyberpunk');
  const [showContours, setShowContours] = useState<boolean>(false);
  const [showMarginals, setShowMarginals] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'compute_desc' | 'tasks_desc' | 'latency_desc' | 'errors_desc' | 'name_asc'>('compute_desc');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCell, setSelectedCell] = useState<HeatmapDataCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataCell | null>(null);

  // Timeline Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Zoom Transform Ref
  const zoomTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  // Generate heatmap dataset based on current active agents and simulation session telemetry
  const heatmapData: HeatmapSessionSummary = useMemo(() => {
    return generateSessionHeatmapData(
      activeAgents,
      agentLogs,
      performanceMetrics,
      granularity,
      granularity === '10s' ? 32 : granularity === '30s' ? 24 : granularity === '1m' ? 18 : 12
    );
  }, [activeAgents, agentLogs, performanceMetrics, granularity]);

  // Filter and Sort Agents
  const filteredAgents = useMemo(() => {
    let list = [...heatmapData.agents];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || (a.model && a.model.toLowerCase().includes(q)));
    }

    if (roleFilter !== 'all') {
      list = list.filter(a => a.role.toLowerCase().includes(roleFilter.toLowerCase()));
    }

    // Sort agents
    const summariesMap = new Map(heatmapData.agentSummaries.map(s => [s.agentId, s]));
    list.sort((a, b) => {
      const sumA = summariesMap.get(a.id);
      const sumB = summariesMap.get(b.id);
      if (!sumA || !sumB) return 0;

      if (sortBy === 'compute_desc') return sumB.avgComputeLoadPct - sumA.avgComputeLoadPct;
      if (sortBy === 'tasks_desc') return sumB.totalTasks - sumA.totalTasks;
      if (sortBy === 'latency_desc') return sumB.avgLatencyMs - sumA.avgLatencyMs;
      if (sortBy === 'errors_desc') return sumB.totalErrors - sumA.totalErrors;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });

    return list;
  }, [heatmapData, searchQuery, roleFilter, sortBy]);

  // Filtered cells list
  const filteredAgentIds = useMemo(() => new Set(filteredAgents.map(a => a.id)), [filteredAgents]);
  const activeCells = useMemo(() => {
    return heatmapData.cells.filter(c => filteredAgentIds.has(c.agentId));
  }, [heatmapData.cells, filteredAgentIds]);

  // Metric value domain calculation
  const metricValues = useMemo(() => {
    return activeCells.map(c => getHeatmapMetricValue(c, metricMode));
  }, [activeCells, metricMode]);

  const maxMetricVal = useMemo(() => {
    const max = Math.max(...metricValues, 1);
    if (metricMode === 'compute') return 100;
    if (metricMode === 'errors') return Math.max(max, 2);
    if (metricMode === 'density') return 100;
    return max;
  }, [metricValues, metricMode]);

  // Playback timer effect
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.round(750 / playbackSpeed);
    const timer = setInterval(() => {
      setPlaybackIndex(prev => {
        const next = prev + 1;
        if (next >= heatmapData.timeBuckets.length) {
          setIsPlaying(false);
          return heatmapData.timeBuckets.length - 1;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, heatmapData.timeBuckets.length]);

  // D3 Color Interpolator
  const getColorInterpolator = (t: number) => {
    const clamped = Math.max(0, Math.min(1, t));
    if (palette === 'cyberpunk') {
      // Custom High-Contrast Cyberpunk Palette: Slate -> Cyan -> Purple -> Amber -> Neon Rose
      if (clamped < 0.2) return d3.interpolateRgb('#0f172a', '#0891b2')(clamped / 0.2);
      if (clamped < 0.5) return d3.interpolateRgb('#0891b2', '#8b5cf6')((clamped - 0.2) / 0.3);
      if (clamped < 0.8) return d3.interpolateRgb('#8b5cf6', '#f59e0b')((clamped - 0.5) / 0.3);
      return d3.interpolateRgb('#f59e0b', '#f43f5e')((clamped - 0.8) / 0.2);
    }
    if (palette === 'turbo') return d3.interpolateTurbo(clamped);
    if (palette === 'viridis') return d3.interpolateViridis(clamped);
    if (palette === 'plasma') return d3.interpolatePlasma(clamped);
    if (palette === 'ember') return d3.interpolateInferno(clamped);
    if (palette === 'emerald') return d3.interpolateYlGn(clamped);
    return d3.interpolateTurbo(clamped);
  };

  // Main D3 Render Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 560;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height);

    // Margins setup
    const margin = {
      top: showMarginals ? 75 : 35,
      right: showMarginals ? 130 : 30,
      bottom: 50,
      left: 170,
    };

    const innerWidth = Math.max(200, width - margin.left - margin.right);
    const innerHeight = Math.max(150, height - margin.top - margin.bottom);

    // Defs for gradients, filters, and patterns
    const defs = svg.append('defs');

    // Glow filter
    const glowFilter = defs.append('filter')
      .attr('id', 'heatmap-glow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Grid pattern
    const pattern = defs.append('pattern')
      .attr('id', 'bg-grid')
      .attr('width', 20)
      .attr('height', 20)
      .attr('patternUnits', 'userSpaceOnUse');
    pattern.append('path')
      .attr('d', 'M 20 0 L 0 0 0 20')
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 0.5);

    // Scales
    const timeBucketLabels = heatmapData.timeBuckets.map(b => b.label);
    const agentIds = filteredAgents.map(a => a.id);

    const xScale = d3.scaleBand()
      .domain(timeBucketLabels)
      .range([0, innerWidth])
      .padding(0.08);

    const yScale = d3.scaleBand()
      .domain(agentIds)
      .range([0, innerHeight])
      .padding(0.08);

    // Main Chart G container with Pan/Zoom support
    const mainGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Background Canvas
    mainGroup.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'url(#bg-grid)')
      .attr('rx', 8)
      .attr('opacity', 0.6);

    // D3 Zoom Behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 3.5])
      .translateExtent([[-margin.left, -margin.top], [width + 200, height + 200]])
      .on('zoom', (event) => {
        zoomTransformRef.current = event.transform;
        tilesGroup.attr('transform', event.transform);
        if (contoursGroup) contoursGroup.attr('transform', event.transform);
        xAxisGroup.call(xAxis.scale(event.transform.rescaleX(xScale as any)));
        yAxisGroup.call(yAxis.scale(event.transform.rescaleY(yScale as any)));
      });

    // Crosshairs Guidelines Layer
    const crosshairGroup = mainGroup.append('g').attr('class', 'crosshairs').style('pointer-events', 'none');
    const crosshairV = crosshairGroup.append('line')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .attr('opacity', 0);
    const crosshairH = crosshairGroup.append('line')
      .attr('stroke', '#a855f7')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .attr('opacity', 0);

    // Contours Layer (Optional Density Interpolation)
    let contoursGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
    if (showContours && activeCells.length > 0) {
      contoursGroup = mainGroup.append('g').attr('class', 'contours-layer').style('pointer-events', 'none');
      
      const contourData = activeCells.map(c => {
        const x = (xScale(c.bucketLabel) || 0) + xScale.bandwidth() / 2;
        const y = (yScale(c.agentId) || 0) + yScale.bandwidth() / 2;
        const weight = getHeatmapMetricValue(c, metricMode) / maxMetricVal;
        return [x, y, weight] as [number, number, number];
      });

      const densityGenerator = d3.contourDensity<[number, number, number]>()
        .x(d => d[0])
        .y(d => d[1])
        .weight(d => d[2])
        .size([innerWidth, innerHeight])
        .bandwidth(30)
        .thresholds(8);

      const contours = densityGenerator(contourData);

      contoursGroup.selectAll('path')
        .data(contours)
        .enter()
        .append('path')
        .attr('d', d3.geoPath())
        .attr('fill', 'none')
        .attr('stroke', (d, i) => getColorInterpolator(i / 8))
        .attr('stroke-width', 1.2)
        .attr('stroke-opacity', 0.65)
        .attr('stroke-dasharray', '2 2');
    }

    // Tiles Layer
    const tilesGroup = mainGroup.append('g').attr('class', 'tiles-layer');

    const cellWidth = xScale.bandwidth();
    const cellHeight = yScale.bandwidth();

    // Render Tiles
    const tiles = tilesGroup.selectAll('.heatmap-cell')
      .data(activeCells, (d: any) => `${d.agentId}-${d.bucketIndex}`)
      .enter()
      .append('g')
      .attr('class', 'heatmap-cell')
      .attr('transform', (d: HeatmapDataCell) => `translate(${xScale(d.bucketLabel) || 0}, ${yScale(d.agentId) || 0})`)
      .style('cursor', 'pointer');

    // Tile Rectangles
    tiles.append('rect')
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('rx', Math.min(4, cellWidth * 0.15))
      .attr('fill', (d: HeatmapDataCell) => {
        const val = getHeatmapMetricValue(d, metricMode);
        const norm = val / maxMetricVal;
        return getColorInterpolator(norm);
      })
      .attr('stroke', (d: HeatmapDataCell) => {
        if (selectedCell && selectedCell.agentId === d.agentId && selectedCell.bucketIndex === d.bucketIndex) {
          return '#38bdf8';
        }
        if (d.errorCount > 0) return '#f43f5e';
        if (d.dominantState === 'working') return 'rgba(168, 85, 247, 0.4)';
        return 'rgba(255, 255, 255, 0.05)';
      })
      .attr('stroke-width', (d: HeatmapDataCell) => {
        if (selectedCell && selectedCell.agentId === d.agentId && selectedCell.bucketIndex === d.bucketIndex) {
          return 2.5;
        }
        if (d.errorCount > 0) return 1.5;
        return 0.8;
      })
      .attr('opacity', (d: HeatmapDataCell) => {
        if (playbackIndex >= 0) {
          return d.bucketIndex <= playbackIndex ? 1 : 0.25;
        }
        return 0.92;
      })
      .style('transition', 'all 0.15s ease-out');

    // Mini activity glyphs / icons inside cells
    tiles.filter((d: HeatmapDataCell) => cellWidth > 24 && cellHeight > 22).each(function(this: any, d: HeatmapDataCell) {
      const g = d3.select(this);
      const val = getHeatmapMetricValue(d, metricMode);
      
      // If error, show warning indicator
      if (d.errorCount > 0) {
        g.append('circle')
          .attr('cx', cellWidth / 2)
          .attr('cy', cellHeight / 2)
          .attr('r', Math.min(cellHeight, cellWidth) * 0.22)
          .attr('fill', '#e11d48')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1);
      } else if (d.dominantState === 'working' && cellWidth > 32 && cellHeight > 26) {
        g.append('text')
          .attr('x', cellWidth / 2)
          .attr('y', cellHeight / 2 + 3)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', Math.min(10, cellHeight * 0.4))
          .attr('font-weight', 'bold')
          .attr('font-family', 'ui-monospace, monospace')
          .style('pointer-events', 'none')
          .text(metricMode === 'tasks' ? d.taskCount : metricMode === 'compute' ? `${d.computeLoadPct}%` : `${Math.round(d.tokensUsed / 1000)}k`);
      }
    });

    // Tile Interactions
    tiles
      .on('mouseenter', (event: any, d: HeatmapDataCell) => {
        setHoveredCell(d);
        
        // Highlight crosshairs
        const cellX = (xScale(d.bucketLabel) || 0) + cellWidth / 2;
        const cellY = (yScale(d.agentId) || 0) + cellHeight / 2;

        crosshairV
          .attr('x1', cellX).attr('y1', 0)
          .attr('x2', cellX).attr('y2', innerHeight)
          .attr('opacity', 0.8);

        crosshairH
          .attr('x1', 0).attr('y1', cellY)
          .attr('x2', innerWidth).attr('y2', cellY)
          .attr('opacity', 0.8);

        d3.select(event.currentTarget).select('rect')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2.5)
          .attr('filter', 'url(#heatmap-glow)');
      })
      .on('mouseleave', (event: any, d: HeatmapDataCell) => {
        setHoveredCell(null);
        crosshairV.attr('opacity', 0);
        crosshairH.attr('opacity', 0);

        const isCurrentSelected = selectedCell && selectedCell.agentId === d.agentId && selectedCell.bucketIndex === d.bucketIndex;
        d3.select(event.currentTarget).select('rect')
          .attr('stroke', isCurrentSelected ? '#38bdf8' : d.errorCount > 0 ? '#f43f5e' : 'rgba(255, 255, 255, 0.05)')
          .attr('stroke-width', isCurrentSelected ? 2.5 : d.errorCount > 0 ? 1.5 : 0.8)
          .attr('filter', null);
      })
      .on('click', (event: any, d: HeatmapDataCell) => {
        setSelectedCell(d);
        if (onSelectAgent) onSelectAgent(d.agentId);
      });

    // Playback Laser Head Marker
    if (playbackIndex >= 0 && playbackIndex < heatmapData.timeBuckets.length) {
      const activeBucket = heatmapData.timeBuckets[playbackIndex];
      const laserX = (xScale(activeBucket.label) || 0) + cellWidth / 2;

      const laserG = mainGroup.append('g').attr('class', 'playback-laser').style('pointer-events', 'none');
      
      laserG.append('line')
        .attr('x1', laserX)
        .attr('y1', -15)
        .attr('x2', laserX)
        .attr('y2', innerHeight + 15)
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '4 2')
        .attr('filter', 'url(#heatmap-glow)');

      laserG.append('circle')
        .attr('cx', laserX)
        .attr('cy', -10)
        .attr('r', 5)
        .attr('fill', '#38bdf8');
    }

    // Top Marginal Histogram (Cluster-Wide Load Over Time)
    if (showMarginals) {
      const topHistogramHeight = margin.top - 18;
      const topG = svg.append('g')
        .attr('class', 'top-marginal-histogram')
        .attr('transform', `translate(${margin.left}, 12)`);

      const maxBucketCompute = Math.max(...heatmapData.timeBuckets.map(b => b.totalComputePct), 1);
      const topYScale = d3.scaleLinear()
        .domain([0, 100])
        .range([topHistogramHeight, 0]);

      // Bars for each time bucket
      topG.selectAll('.top-hist-bar')
        .data(heatmapData.timeBuckets)
        .enter()
        .append('rect')
        .attr('class', 'top-hist-bar')
        .attr('x', d => xScale(d.label) || 0)
        .attr('y', d => topYScale(d.totalComputePct))
        .attr('width', cellWidth)
        .attr('height', d => Math.max(0, topHistogramHeight - topYScale(d.totalComputePct)))
        .attr('rx', 2)
        .attr('fill', d => {
          if (playbackIndex >= 0 && d.index === playbackIndex) return '#38bdf8';
          if (d.errorCount > 0) return '#f43f5e';
          if (d.totalComputePct > 70) return '#a855f7';
          return '#334155';
        })
        .attr('opacity', 0.85);

      // Top Histogram Area Baseline Label
      topG.append('text')
        .attr('x', -8)
        .attr('y', 10)
        .attr('text-anchor', 'end')
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .text('Cluster %');
    }

    // Right Marginal Bar Chart (Per-Agent Aggregate Total Tasks / Compute)
    if (showMarginals) {
      const rightBarWidth = margin.right - 25;
      const rightG = svg.append('g')
        .attr('class', 'right-marginal-bars')
        .attr('transform', `translate(${width - margin.right + 12}, ${margin.top})`);

      const summariesMap = new Map(heatmapData.agentSummaries.map(s => [s.agentId, s]));
      const rightXScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, rightBarWidth]);

      filteredAgents.forEach(agent => {
        const sum = summariesMap.get(agent.id);
        const yPos = yScale(agent.id) || 0;
        const loadVal = sum?.avgComputeLoadPct || 0;

        // Background Bar
        rightG.append('rect')
          .attr('x', 0)
          .attr('y', yPos + cellHeight * 0.15)
          .attr('width', rightBarWidth)
          .attr('height', cellHeight * 0.7)
          .attr('rx', 3)
          .attr('fill', '#1e293b')
          .attr('opacity', 0.5);

        // Filled Metric Bar
        rightG.append('rect')
          .attr('x', 0)
          .attr('y', yPos + cellHeight * 0.15)
          .attr('width', rightXScale(loadVal))
          .attr('height', cellHeight * 0.7)
          .attr('rx', 3)
          .attr('fill', getColorInterpolator(loadVal / 100))
          .attr('opacity', 0.85);

        // Text summary
        rightG.append('text')
          .attr('x', rightBarWidth - 4)
          .attr('y', yPos + cellHeight * 0.6)
          .attr('text-anchor', 'end')
          .attr('fill', '#f1f5f9')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'ui-monospace, monospace')
          .text(`${loadVal}%`);
      });

      // Right Header Label
      svg.append('text')
        .attr('x', width - margin.right + 12)
        .attr('y', margin.top - 8)
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'ui-monospace, monospace')
        .text('Avg Compute');
    }

    // X-Axis (Time Buckets)
    const xAxis = d3.axisBottom(xScale)
      .tickSize(4)
      .tickFormat((d, i) => {
        // Sample ticks on smaller widths
        if (timeBucketLabels.length > 20 && i % 2 !== 0 && i !== timeBucketLabels.length - 1) return '';
        return d;
      });

    const xAxisGroup = mainGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    xAxisGroup.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('dy', '0.7em');

    xAxisGroup.selectAll('line, path').attr('stroke', '#334155');

    // X-Axis Title
    mainGroup.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 36)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-mono', 'true')
      .text(`Simulation Session Timeline (${granularity} resolution) • T-0 (Recent)`);

    // Y-Axis (Agent Names, Roles, Avatars)
    const yAxis = d3.axisLeft(yScale).tickSize(0);
    const yAxisGroup = mainGroup.append('g').attr('class', 'y-axis').call(yAxis);
    yAxisGroup.select('.domain').attr('stroke', '#334155');

    // Custom Rich Y-Axis Labels
    yAxisGroup.selectAll('.tick text').remove();
    yAxisGroup.selectAll('.tick').each(function(agentId) {
      const agent = filteredAgents.find(a => a.id === agentId);
      if (!agent) return;

      const tickG = d3.select(this);
      const yCenter = (yScale.bandwidth() || 0) / 2;

      // Agent Name
      tickG.append('text')
        .attr('x', -12)
        .attr('y', yCenter - 3)
        .attr('text-anchor', 'end')
        .attr('fill', '#e2e8f0')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text(agent.name);

      // Agent Role Subtitle
      tickG.append('text')
        .attr('x', -12)
        .attr('y', yCenter + 9)
        .attr('text-anchor', 'end')
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .text(agent.role.length > 18 ? `${agent.role.substring(0, 16)}...` : agent.role);
    });

  }, [
    filteredAgents, 
    activeCells, 
    heatmapData, 
    metricMode, 
    maxMetricVal, 
    palette, 
    showContours, 
    showMarginals, 
    playbackIndex, 
    granularity, 
    selectedCell
  ]);

  // Export Matrix to CSV
  const handleExportCSV = () => {
    const headers = ['AgentID', 'AgentName', 'AgentRole', 'TimeBucket', 'TaskCount', 'ComputeLoadPct', 'TokensUsed', 'LatencyMs', 'Errors', 'DominantState'];
    const rows = activeCells.map(c => [
      c.agentId,
      `"${c.agentName}"`,
      `"${c.agentRole}"`,
      c.bucketLabel,
      c.taskCount,
      c.computeLoadPct,
      c.tokensUsed,
      c.avgLatencyMs,
      c.errorCount,
      c.dominantState
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `plurality_agent_activity_heatmap_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      title: '📊 Heatmap Export Complete',
      message: `Exported ${activeCells.length} matrix data points to CSV format.`,
      type: 'success'
    });
  };

  // Inspect Target Cell
  const activeInspectorCell = hoveredCell || selectedCell || activeCells[0] || null;

  return (
    <div className={cn("flex flex-col h-full w-full bg-gray-950 text-gray-100 overflow-hidden select-none", className)}>
      
      {/* Control Header & Toolbar */}
      <div className="bg-gray-900/90 border-b border-gray-800 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
        
        {/* Metric Selector Tabs */}
        <div className="flex items-center space-x-1.5 bg-gray-950 p-1 rounded-lg border border-gray-800">
          {[
            { id: 'compute', label: 'Compute Load', icon: Cpu },
            { id: 'tasks', label: 'Task Count', icon: BarChart3 },
            { id: 'tokens', label: 'Token Volume', icon: Zap },
            { id: 'latency', label: 'Latency (ms)', icon: Clock },
            { id: 'errors', label: 'Errors & Faults', icon: ShieldAlert },
            { id: 'density', label: 'Activity Index', icon: Flame },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = metricMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMetricMode(tab.id as HeatmapMetricMode)}
                className={cn(
                  "flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all",
                  isSelected
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm font-bold"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/80"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-gray-400")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Playback Controls & Granularity */}
        <div className="flex items-center space-x-2">
          
          {/* Resolution / Granularity Selector */}
          <div className="flex items-center space-x-1 bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs">
            <span className="text-[10px] font-mono text-gray-500 uppercase px-1">Res:</span>
            {(['10s', '30s', '1m', '5m'] as HeatmapTimeGranularity[]).map(res => (
              <button
                key={res}
                onClick={() => {
                  setGranularity(res);
                  setPlaybackIndex(-1);
                  setIsPlaying(false);
                }}
                className={cn(
                  "px-2 py-0.5 rounded font-mono text-[11px] transition-colors",
                  granularity === res
                    ? "bg-purple-950 text-purple-300 font-bold border border-purple-800"
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                {res}
              </button>
            ))}
          </div>

          {/* Timeline Playback Bar */}
          <div className="flex items-center space-x-1 bg-gray-950 p-1 rounded-lg border border-gray-800">
            <button
              onClick={() => {
                if (playbackIndex >= heatmapData.timeBuckets.length - 1) {
                  setPlaybackIndex(0);
                }
                setIsPlaying(!isPlaying);
              }}
              className={cn(
                "px-2.5 py-1 text-xs rounded font-semibold flex items-center space-x-1.5 transition-all",
                isPlaying
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              )}
              title={isPlaying ? "Pause timeline playback" : "Simulate live timeline playback"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : playbackIndex >= 0 ? 'Resume' : 'Play Timeline'}</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setPlaybackIndex(-1);
              }}
              disabled={playbackIndex === -1}
              className="p-1 text-gray-400 hover:text-gray-100 disabled:opacity-30 rounded hover:bg-gray-800 transition-colors"
              title="Reset timeline playback to full session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Speed Toggle */}
            <button
              onClick={() => setPlaybackSpeed(s => s === 1 ? 2 : s === 2 ? 0.5 : 1)}
              className="px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 hover:text-cyan-200 bg-gray-900 rounded border border-gray-800"
              title="Toggle playback speed (0.5x, 1x, 2x)"
            >
              {playbackSpeed}x
            </button>
          </div>

          {/* Visual Palette Selector */}
          <div className="flex items-center space-x-1 bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 ml-1" />
            {(['cyberpunk', 'turbo', 'viridis', 'plasma', 'ember'] as HeatmapColorPalette[]).map(p => (
              <button
                key={p}
                onClick={() => setPalette(p)}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] uppercase font-mono transition-colors",
                  palette === p
                    ? "bg-blue-950 text-blue-300 font-bold border border-blue-800"
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                {p.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Density Contours Toggle */}
          <button
            onClick={() => setShowContours(!showContours)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-lg font-medium border flex items-center space-x-1 transition-all",
              showContours
                ? "bg-purple-950 text-purple-300 border-purple-700"
                : "bg-gray-950 text-gray-400 border-gray-800 hover:bg-gray-900"
            )}
            title="Toggle 2D D3 Density Contours Overlay"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Contours</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="p-1.5 rounded-lg bg-gray-950 hover:bg-gray-900 text-gray-300 hover:text-white border border-gray-800 transition-colors"
            title="Export heatmap matrix to CSV"
          >
            <Download className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Sub-toolbar: Search, Filters, Sorters & KPI Pills */}
      <div className="bg-gray-900/60 border-b border-gray-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        
        {/* Left: Filters & Search */}
        <div className="flex items-center space-x-2">
          {/* Search Input */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter agent or model..."
              className="w-full pl-8 pr-2.5 py-1 bg-gray-950 border border-gray-800 rounded-md text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="architect">Architects</option>
            <option value="builder">Builders</option>
            <option value="reviewer">Reviewers</option>
            <option value="compliance">QA & Compliance</option>
            <option value="auditor">Auditors</option>
          </select>

          {/* Sort Selector */}
          <div className="flex items-center space-x-1 text-gray-400 font-mono text-[11px]">
            <ArrowUpDown className="w-3 h-3 text-gray-500" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-gray-950 border border-gray-800 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
            >
              <option value="compute_desc">Sort: Highest Compute</option>
              <option value="tasks_desc">Sort: Most Tasks</option>
              <option value="latency_desc">Sort: Highest Latency</option>
              <option value="errors_desc">Sort: Most Errors</option>
              <option value="name_asc">Sort: Agent Name</option>
            </select>
          </div>
        </div>

        {/* Right: Cluster Telemetry Summary Stats */}
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <div className="flex items-center space-x-1.5 text-gray-400">
            <span className="text-gray-500">Session:</span>
            <span className="text-gray-200 font-bold">{heatmapData.clusterStats.totalSessionDurationMinutes}m</span>
          </div>
          <div className="flex items-center space-x-1.5 text-gray-400">
            <span className="text-gray-500">Total Tasks:</span>
            <span className="text-cyan-300 font-bold">{heatmapData.clusterStats.totalTasksExecuted}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-gray-400">
            <span className="text-gray-500">Total Tokens:</span>
            <span className="text-amber-300 font-bold">{heatmapData.clusterStats.totalTokensConsumed.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-gray-400">
            <span className="text-gray-500">Cluster Util:</span>
            <span className={cn(
              "font-bold",
              heatmapData.clusterStats.avgClusterUtilizationPct > 65 ? "text-amber-400" : "text-emerald-400"
            )}>
              {heatmapData.clusterStats.avgClusterUtilizationPct}%
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-gray-400">
            <span className="text-gray-500">Peak Node:</span>
            <span className="text-purple-300 font-bold">{heatmapData.clusterStats.peakComputeAgentName}</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Stage & Inspector Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* D3 Heatmap Canvas Container */}
        <div ref={containerRef} className="flex-1 h-full w-full relative overflow-hidden bg-gray-950 p-2">
          <svg ref={svgRef} className="w-full h-full block" />

          {/* Bottom Left Legend */}
          <div className="absolute bottom-3 left-4 bg-gray-900/90 border border-gray-800 rounded-lg px-3 py-2 flex items-center space-x-3 shadow-md backdrop-blur-sm">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
              {metricMode.toUpperCase()} Intensity:
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-mono text-gray-500">0</span>
              <div 
                className="w-24 h-2.5 rounded-full border border-gray-700" 
                style={{
                  background: palette === 'cyberpunk'
                    ? 'linear-gradient(to right, #0f172a, #0891b2, #8b5cf6, #f59e0b, #f43f5e)'
                    : palette === 'viridis'
                    ? 'linear-gradient(to right, #440154, #3b528b, #21908d, #5dc863, #fde725)'
                    : palette === 'plasma'
                    ? 'linear-gradient(to right, #0d0887, #6a00a8, #b12a90, #e16462, #fca636)'
                    : palette === 'ember'
                    ? 'linear-gradient(to right, #000004, #51127c, #b73779, #fb8861, #fcffa4)'
                    : 'linear-gradient(to right, #30123b, #4686fb, #1ae4b6, #a2fc3c, #e83f0c)'
                }}
              />
              <span className="text-[10px] font-mono text-gray-300 font-bold">
                {formatHeatmapMetricDisplay(maxMetricVal, metricMode)}
              </span>
            </div>
            
            <div className="h-3 w-px bg-gray-800" />

            <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Error</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Working</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-slate-700" />
                <span>Idle</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Cell Inspector HUD Panel */}
        <div className="w-80 border-l border-gray-800 bg-gray-900/90 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
          
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                Cell Telemetry HUD
              </h3>
            </div>
            <span className="text-[10px] font-mono text-gray-500 bg-gray-950 border border-gray-800 px-1.5 py-0.5 rounded">
              {hoveredCell ? 'Live Hover' : 'Selected'}
            </span>
          </div>

          {activeInspectorCell ? (
            <div className="space-y-4">
              
              {/* Agent Profile Card */}
              <div className="p-3 rounded-xl bg-gray-950/80 border border-gray-800 space-y-2">
                <div className="flex items-center space-x-2.5">
                  {activeInspectorCell.agentAvatarUrl ? (
                    <img 
                      src={activeInspectorCell.agentAvatarUrl} 
                      alt={activeInspectorCell.agentName} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover border border-purple-500/50 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-purple-950 border border-purple-700 text-purple-300 flex items-center justify-center font-bold">
                      {activeInspectorCell.agentName[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-100 truncate">
                        {activeInspectorCell.agentName}
                      </h4>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase border",
                        activeInspectorCell.dominantState === 'error'
                          ? "bg-rose-950 text-rose-300 border-rose-800"
                          : activeInspectorCell.dominantState === 'working'
                          ? "bg-purple-950 text-purple-300 border-purple-800"
                          : "bg-gray-900 text-gray-400 border-gray-800"
                      )}>
                        {activeInspectorCell.dominantState}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate font-mono">
                      {activeInspectorCell.agentRole}
                    </p>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      Model: {activeInspectorCell.model || 'claude-3-5-sonnet'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-900 flex items-center justify-between text-[10px] font-mono text-gray-400">
                  <span>Epoch Slice: <strong className="text-purple-300">{activeInspectorCell.bucketLabel}</strong></span>
                  <span>Flavor: <strong className="text-gray-300 uppercase">{activeInspectorCell.flavor || 'harness'}</strong></span>
                </div>
              </div>

              {/* Granular Metric Breakdown */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                  <span>Time-Slice Metrics</span>
                  <span className="font-mono text-blue-400 text-[10px]">{granularity} window</span>
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-gray-950/80 border border-gray-800/80 space-y-0.5">
                    <span className="text-[10px] text-gray-500 font-mono">Compute Load</span>
                    <div className="text-sm font-bold text-cyan-300 font-mono">
                      {activeInspectorCell.computeLoadPct}%
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-950/80 border border-gray-800/80 space-y-0.5">
                    <span className="text-[10px] text-gray-500 font-mono">Tasks Executed</span>
                    <div className="text-sm font-bold text-purple-300 font-mono">
                      {activeInspectorCell.taskCount}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-950/80 border border-gray-800/80 space-y-0.5">
                    <span className="text-[10px] text-gray-500 font-mono">Tokens Total</span>
                    <div className="text-sm font-bold text-amber-300 font-mono">
                      {activeInspectorCell.tokensUsed.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-950/80 border border-gray-800/80 space-y-0.5">
                    <span className="text-[10px] text-gray-500 font-mono">Response Latency</span>
                    <div className="text-sm font-bold text-emerald-300 font-mono">
                      {activeInspectorCell.avgLatencyMs}ms
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-950/80 border border-gray-800/80 space-y-0.5">
                    <span className="text-[10px] text-gray-500 font-mono">CPU Core Load</span>
                    <div className="text-sm font-bold text-gray-200 font-mono">
                      {activeInspectorCell.cpuPct}%
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-950/80 border border-gray-800/80 space-y-0.5">
                    <span className="text-[10px] text-gray-500 font-mono">Memory Alloc</span>
                    <div className="text-sm font-bold text-gray-200 font-mono">
                      {activeInspectorCell.memoryMb}MB
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Subtask Actions in Slice */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Executed Subtasks & Logs
                </h4>
                <div className="space-y-1">
                  {activeInspectorCell.activeActions.map((act, i) => (
                    <div key={i} className="p-1.5 rounded bg-gray-950 border border-gray-800/80 text-[10px] font-mono text-gray-300 flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="truncate">{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-gray-800 flex flex-col space-y-2">
                <button
                  onClick={() => selectAgentForLogs(activeInspectorCell.agentId)}
                  className="w-full py-1.5 px-3 rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-700/80 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Inspect Agent Stream Logs</span>
                </button>

                <button
                  onClick={() => openAgentConfigModal(activeInspectorCell.agentId)}
                  className="w-full py-1.5 px-3 rounded-lg bg-gray-950 hover:bg-gray-800 text-gray-300 border border-gray-800 text-xs font-medium flex items-center justify-center space-x-2 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>Configure Agent Persona</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-xs space-y-2">
              <Info className="w-8 h-8 mx-auto text-gray-600" />
              <p>Hover or click on any matrix cell to inspect granular task density & compute load.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
