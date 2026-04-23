import React, { useState } from 'react';
import { DailyLog } from '../../types/trip';

interface DailyLogSVGProps {
  log: DailyLog;
}

export const DailyLogSVG: React.FC<DailyLogSVGProps> = ({ log }) => {
  const [typedSignature, setTypedSignature] = useState(log.driver_name || '');

  // Parse YYYY-MM-DD
  const dateParts = log.date_str.split('-');
  const year = dateParts[0] || '2026';
  const month = dateParts[1] || '10';
  const day = dateParts[2] || '08';

  // SVG Grid coordinate geometry
  const svgWidth = 980;
  const svgHeight = 720;

  const gridLeft = 140;
  const gridRight = 890;
  const gridWidth = gridRight - gridLeft; // 750px for 24 hours -> 31.25px per hour
  const gridTop = 165;
  const rowHeight = 24;
  const numRows = 4;
  const gridBottom = gridTop + numRows * rowHeight; // 165 + 96 = 261

  // Row Y center coordinates for the 4 duty status rows
  // 1: Off Duty, 2: Sleeper Berth, 3: Driving, 4: On Duty (not driving)
  const getRowCenterY = (rowIdx: number) => {
    return gridTop + (rowIdx - 1) * rowHeight + rowHeight / 2;
  };

  const minuteToX = (minute: number) => {
    return gridLeft + (minute / 1440.0) * gridWidth;
  };

  // Build the continuous SVG polyline path for the schedule
  const buildSchedulePath = () => {
    if (!log.segments || log.segments.length === 0) return '';

    let d = '';
    const sorted = [...log.segments].sort((a, b) => a.start_minute - b.start_minute);

    for (let i = 0; i < sorted.length; i++) {
      const seg = sorted[i];
      const xStart = minuteToX(seg.start_minute);
      const xEnd = minuteToX(seg.end_minute);
      const y = getRowCenterY(seg.grid_row_index);

      if (i === 0) {
        d += `M ${xStart.toFixed(1)} ${y.toFixed(1)} `;
      } else {
        // Vertical connector from previous segment
        const prevSeg = sorted[i - 1];
        if (prevSeg.grid_row_index !== seg.grid_row_index) {
          d += `L ${xStart.toFixed(1)} ${y.toFixed(1)} `;
        }
      }

      // Horizontal segment across the duration
      d += `L ${xEnd.toFixed(1)} ${y.toFixed(1)} `;
    }

    return d;
  };

  const schedulePath = buildSchedulePath();

  return (
    <div className="daily-log-page bg-white text-black p-4 sm:p-6 rounded-2xl shadow-2xl border border-slate-300 font-sans mx-auto max-w-[1020px] select-text">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        style={{ fontFamily: 'Inter, Arial, sans-serif' }}
      >
        {/* ================= HEADER SECTION ================= */}
        {/* Title */}
        <text x="25" y="32" fontSize="22" fontWeight="900" fill="#000000" letterSpacing="-0.5">
          Drivers Daily Log
        </text>
        <text x="25" y="46" fontSize="11" fontWeight="600" fill="#444444">
          (24 hours)
        </text>

        {/* Date Month/Day/Year */}
        <g transform="translate(320, 15)">
          <text x="0" y="20" fontSize="13" fontWeight="bold" textAnchor="middle" fill="#000000">{month}</text>
          <line x1="-25" y1="23" x2="25" y2="23" stroke="#000000" strokeWidth="1" />
          <text x="0" y="34" fontSize="9" textAnchor="middle" fill="#666666">(month)</text>

          <text x="32" y="20" fontSize="14" fill="#000000">/</text>

          <text x="65" y="20" fontSize="13" fontWeight="bold" textAnchor="middle" fill="#000000">{day}</text>
          <line x1="40" y1="23" x2="90" y2="23" stroke="#000000" strokeWidth="1" />
          <text x="65" y="34" fontSize="9" textAnchor="middle" fill="#666666">(day)</text>

          <text x="98" y="20" fontSize="14" fill="#000000">/</text>

          <text x="135" y="20" fontSize="13" fontWeight="bold" textAnchor="middle" fill="#000000">{year}</text>
          <line x1="108" y1="23" x2="162" y2="23" stroke="#000000" strokeWidth="1" />
          <text x="135" y="34" fontSize="9" textAnchor="middle" fill="#666666">(year)</text>
        </g>

        {/* Filing Instructions Right */}
        <text x="955" y="25" fontSize="9.5" textAnchor="end" fill="#222222" fontWeight="500">
          Original - File at home terminal.
        </text>
        <text x="955" y="38" fontSize="9.5" textAnchor="end" fill="#222222" fontWeight="500">
          Duplicate - Driver retains in his/her possession for 8 days.
        </text>

        {/* From & To */}
        <text x="25" y="70" fontSize="12" fontWeight="bold" fill="#000000">From:</text>
        <text x="70" y="70" fontSize="12" fontWeight="600" fill="#000000">{log.from_location || 'Not provided'}</text>
        <line x1="68" y1="74" x2="440" y2="74" stroke="#000000" strokeWidth="1" />

        <text x="490" y="70" fontSize="12" fontWeight="bold" fill="#000000">To:</text>
        <text x="520" y="70" fontSize="12" fontWeight="600" fill="#000000">{log.to_location || 'Not provided'}</text>
        <line x1="518" y1="74" x2="955" y2="74" stroke="#000000" strokeWidth="1" />

        {/* ================= METADATA BOXES ================= */}
        {/* Box: Total Miles Driving Today */}
        <rect x="25" y="86" width="135" height="26" fill="#fcfcfc" stroke="#000000" strokeWidth="1" />
        <text x="92" y="103" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#000000">
          {log.miles_driving_today.toFixed(1)}
        </text>
        <text x="92" y="122" fontSize="8" textAnchor="middle" fill="#333333">Total Miles Driving Today</text>

        {/* Box: Total Mileage Today */}
        <rect x="175" y="86" width="135" height="26" fill="#fcfcfc" stroke="#000000" strokeWidth="1" />
        <text x="242" y="103" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#000000">
          {log.total_mileage_today ? log.total_mileage_today.toFixed(1) : '—'}
        </text>
        <text x="242" y="122" fontSize="8" textAnchor="middle" fill="#333333">Total Mileage Today</text>

        {/* Line: Name of Carrier */}
        <text x="440" y="100" fontSize="10" fontWeight="bold" fill="#000000">Name of Carrier:</text>
        <text x="540" y="100" fontSize="11" fontWeight="600" fill="#000000">{log.carrier_name || 'Not provided'}</text>
        <line x1="440" y1="104" x2="955" y2="104" stroke="#000000" strokeWidth="0.75" />

        {/* Box: Truck / Tractor Numbers */}
        <rect x="25" y="126" width="285" height="24" fill="#fcfcfc" stroke="#000000" strokeWidth="1" />
        <text x="167" y="142" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#000000">
          {log.truck_number ? `Truck: ${log.truck_number}` : ''} {log.trailer_number ? `• Trailer: ${log.trailer_number}` : ''}
        </text>
        <text x="167" y="157" fontSize="7.5" textAnchor="middle" fill="#333333">
          Truck/Tractor and Trailer Numbers or License Plate(s)/State (show each unit)
        </text>

        {/* Line: Main Office Address */}
        <text x="440" y="123" fontSize="10" fontWeight="bold" fill="#000000">Main Office Address:</text>
        <text x="560" y="123" fontSize="10" fill="#222222">{log.main_office_address || 'Not provided'}</text>
        <line x1="440" y1="126" x2="955" y2="126" stroke="#000000" strokeWidth="0.75" />

        {/* Line: Home Terminal Address */}
        <text x="440" y="145" fontSize="10" fontWeight="bold" fill="#000000">Home Terminal Address:</text>
        <text x="575" y="145" fontSize="10" fill="#222222">{log.home_terminal_address || 'Not provided'}</text>
        <line x1="440" y1="148" x2="955" y2="148" stroke="#000000" strokeWidth="0.75" />

        {/* ================= 24-HOUR GRID ================= */}
        {/* Black Header Banner */}
        <rect x={gridLeft} y={gridTop - 22} width={gridWidth} height="22" fill="#000000" />
        <rect x={gridRight + 5} y={gridTop - 22} width="60" height="22" fill="#000000" />
        <text x={gridRight + 35} y={gridTop - 8} fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">
          Total Hours
        </text>

        {/* Hour Header Labels */}
        {Array.from({ length: 25 }).map((_, h) => {
          const x = gridLeft + (h / 24.0) * gridWidth;
          let label = `${h}`;
          if (h === 0) label = 'Mid-night';
          else if (h === 12) label = 'Noon';
          else if (h === 24) label = 'Mid-night';
          else if (h > 12) label = `${h - 12}`;

          return (
            <text
              key={h}
              x={x}
              y={gridTop - 7}
              fontSize={h === 0 || h === 24 ? "7.5" : h === 12 ? "8" : "9"}
              fontWeight="bold"
              fill="#ffffff"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}

        {/* Grid Outline */}
        <rect
          x={gridLeft}
          y={gridTop}
          width={gridWidth}
          height={numRows * rowHeight}
          fill="none"
