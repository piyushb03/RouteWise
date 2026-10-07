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
          stroke="#000000"
          strokeWidth="1.5"
        />

        {/* Row Labels & Dividers */}
        {[
          { idx: 1, label: '1. Off Duty' },
          { idx: 2, label: '2. Sleeper Berth' },
          { idx: 3, label: '3. Driving' },
          { idx: 4, label: '4. On Duty (not driving)' },
        ].map((r) => {
          const y = gridTop + (r.idx - 1) * rowHeight;
          return (
            <g key={r.idx}>
              {/* Row Label (left) */}
              <text x="25" y={y + 16} fontSize="10.5" fontWeight="bold" fill="#000000">
                {r.label}
              </text>
              {/* Horizontal Row Divider */}
              <line
                x1={gridLeft}
                y1={y + rowHeight}
                x2={gridRight}
                y2={y + rowHeight}
                stroke="#000000"
                strokeWidth="1"
              />
            </g>
          );
        })}

        {/* Quarter-Hour Ticks across all 24 hours */}
        {Array.from({ length: 24 }).map((_, h) => {
          const xHour = gridLeft + (h / 24.0) * gridWidth;
          const hourWidth = gridWidth / 24.0;

          return (
            <g key={h}>
              {/* Major Hour Line across entire grid */}
              <line
                x1={xHour}
                y1={gridTop}
                x2={xHour}
                y2={gridBottom}
                stroke="#000000"
                strokeWidth="1"
              />

              {/* Sub-ticks for 15, 30, 45 minutes in each row */}
              {[1, 2, 3, 4].map((r) => {
                const yRowTop = gridTop + (r - 1) * rowHeight;
                const x15 = xHour + hourWidth * 0.25;
                const x30 = xHour + hourWidth * 0.5;
                const x45 = xHour + hourWidth * 0.75;

                return (
                  <g key={r} stroke="#888888" strokeWidth="0.75">
                    {/* 15m top/bottom ticks */}
                    <line x1={x15} y1={yRowTop} x2={x15} y2={yRowTop + 4} />
                    <line x1={x15} y1={yRowTop + rowHeight - 4} x2={x15} y2={yRowTop + rowHeight} />

                    {/* 30m taller tick */}
                    <line x1={x30} y1={yRowTop} x2={x30} y2={yRowTop + 8} stroke="#444444" strokeWidth="0.85" />
                    <line x1={x30} y1={yRowTop + rowHeight - 8} x2={x30} y2={yRowTop + rowHeight} stroke="#444444" strokeWidth="0.85" />

                    {/* 45m top/bottom ticks */}
                    <line x1={x45} y1={yRowTop} x2={x45} y2={yRowTop + 4} />
                    <line x1={x45} y1={yRowTop + rowHeight - 4} x2={x45} y2={yRowTop + rowHeight} />
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* Final 24th hour right border */}
        <line x1={gridRight} y1={gridTop} x2={gridRight} y2={gridBottom} stroke="#000000" strokeWidth="1.5" />

        {/* Right Totals Values for lines 1, 2, 3, 4 */}
        <g transform={`translate(${gridRight + 10}, ${gridTop})`}>
          {/* Row 1 total */}
          <text x="25" y="17" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#000000">
            {log.hours_off_duty.toFixed(2)}
          </text>
          <line x1="5" y1="22" x2="45" y2="22" stroke="#000000" strokeWidth="1" />

          {/* Row 2 total */}
          <text x="25" y="41" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#000000">
            {log.hours_sleeper_berth.toFixed(2)}
          </text>
          <line x1="5" y1="46" x2="45" y2="46" stroke="#000000" strokeWidth="1" />

          {/* Row 3 total */}
          <text x="25" y="65" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#000000">
            {log.hours_driving.toFixed(2)}
          </text>
          <line x1="5" y1="70" x2="45" y2="70" stroke="#000000" strokeWidth="1" />

          {/* Row 4 total */}
          <text x="25" y="89" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#000000">
            {log.hours_on_duty_not_driving.toFixed(2)}
          </text>
          <line x1="5" y1="94" x2="45" y2="94" stroke="#000000" strokeWidth="1" />

          {/* Total Sum (24.0) */}
          <text x="25" y="112" fontSize="11" fontWeight="900" textAnchor="middle" fill="#000000">
            = {log.total_hours.toFixed(2)}
          </text>
        </g>

        {/* ================= PLOTTED SCHEDULE LINES ================= */}
        {/* Draw continuous route duty status line */}
        {schedulePath && (
          <path
            d={schedulePath}
            fill="none"
            stroke="#0284c7"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="miter"
            className="print:stroke-black"
          />
        )}

        {/* ================= LOWER SECTION: REMARKS & SHIPPING ================= */}
        {/* Shipping Documents (Left Column) */}
        <g transform="translate(25, 275)">
          <text x="0" y="20" fontSize="13" fontWeight="bold" fill="#000000">
            Shipping Documents:
          </text>

          <text x="0" y="45" fontSize="9" fontWeight="bold" fill="#333333">
            DVL or Manifest No. or
          </text>
          <text x="0" y="60" fontSize="11" fontWeight="600" fill="#000000">
            {log.shipping_doc_number || ''}
          </text>
          <line x1="0" y1="64" x2="160" y2="64" stroke="#000000" strokeWidth="0.75" />

          <text x="0" y="85" fontSize="9" fontWeight="bold" fill="#333333">
            Shipper & Commodity
          </text>
          <text x="0" y="100" fontSize="11" fontWeight="600" fill="#000000">
            {log.commodity || ''}
          </text>
          <line x1="0" y1="104" x2="160" y2="104" stroke="#000000" strokeWidth="0.75" />
        </g>

        {/* Remarks Section (Right Column) */}
        <g transform="translate(205, 275)">
          <text x="0" y="20" fontSize="14" fontWeight="bold" fill="#000000">
            Remarks
          </text>
          <text x="0" y="34" fontSize="8.5" fill="#555555">
            Enter name of place you reported and where released from work and when and where each change of duty occurred. Use time standard of home terminal.
          </text>

          {/* Remarks Lines */}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={i} x1="0" y1={52 + i * 20} x2="750" y2={52 + i * 20} stroke="#cccccc" strokeWidth="0.75" />
          ))}

          {/* Render Actual Remarks entries */}
          {log.remarks && log.remarks.slice(0, 7).map((rem, i) => (
            <text key={i} x="5" y={48 + i * 20} fontSize="9.5" fill="#000000" fontWeight="500">
              <tspan fontWeight="bold" fill="#0284c7" className="print:fill-black">[{rem.time_str}]</tspan>
              <tspan fontWeight="bold"> {rem.status.replace(/_/g, ' ')}: </tspan>
              <tspan>{rem.activity}</tspan>
              {rem.location_str && <tspan fill="#444444"> — near {rem.location_str}</tspan>}
            </text>
          ))}
        </g>

        {/* ================= RECAP SECTION (70 Hour / 8 Day) ================= */}
        <g transform="translate(25, 475)">
          {/* Top border */}
          <line x1="0" y1="0" x2="930" y2="0" stroke="#000000" strokeWidth="1" />

          {/* Left Recap Title */}
          <text x="0" y="16" fontSize="10" fontWeight="bold" fill="#000000">Recap: Complete at</text>
          <text x="0" y="28" fontSize="10" fontWeight="bold" fill="#000000">end of day</text>

          {/* Table 70 Hour / 8 Day Drivers */}
          <text x="140" y="16" fontSize="11" fontWeight="bold" fill="#000000">70 Hour / 8 Day Drivers</text>

          {/* Col: On duty today */}
          <text x="140" y="35" fontSize="8" fill="#333333">On duty hours today,</text>
          <text x="140" y="45" fontSize="8" fill="#333333">Total lines 3 & 4</text>
          <text x="140" y="65" fontSize="13" fontWeight="bold" fill="#000000">
            {log.recap?.on_duty_today.toFixed(2)}h
          </text>
          <line x1="140" y1="70" x2="220" y2="70" stroke="#000000" strokeWidth="1" />

          {/* Col A */}
          <text x="250" y="25" fontSize="9" fontWeight="bold" fill="#000000">A.</text>
          <text x="250" y="35" fontSize="8" fill="#333333">Total hours on duty</text>
          <text x="250" y="45" fontSize="8" fill="#333333">last 7 days incl. today</text>
          <text x="250" y="65" fontSize="13" fontWeight="bold" fill="#000000">
            {log.recap?.total_hours_last_7_days.toFixed(2)}h
          </text>
          <line x1="250" y1="70" x2="340" y2="70" stroke="#000000" strokeWidth="1" />

          {/* Col B */}
          <text x="370" y="25" fontSize="9" fontWeight="bold" fill="#000000">B.</text>
          <text x="370" y="35" fontSize="8" fill="#333333">Total hours available</text>
          <text x="370" y="45" fontSize="8" fill="#333333">tomorrow 70 hr. minus A*</text>
          <text x="370" y="65" fontSize="13" fontWeight="bold" fill="#000000">
            {log.recap?.hours_available_tomorrow.toFixed(2)}h
          </text>
          <line x1="370" y1="70" x2="470" y2="70" stroke="#000000" strokeWidth="1" />

          {/* Col C */}
          <text x="500" y="25" fontSize="9" fontWeight="bold" fill="#000000">C.</text>
          <text x="500" y="35" fontSize="8" fill="#333333">Total hours on duty</text>
          <text x="500" y="45" fontSize="8" fill="#333333">last 8 days incl. today</text>
          <text x="500" y="65" fontSize="13" fontWeight="bold" fill="#000000">
            {log.recap?.total_hours_last_8_days.toFixed(2)}h
          </text>
          <line x1="500" y1="70" x2="590" y2="70" stroke="#000000" strokeWidth="1" />

          {/* 34h restart note */}
          <text x="620" y="35" fontSize="8.5" fill="#333333" width="160">
            *If you took 34 consecutive
          </text>
          <text x="620" y="46" fontSize="8.5" fill="#333333">
            hours off duty you have
          </text>
          <text x="620" y="57" fontSize="8.5" fill="#333333">
            70 hours available.
          </text>
          {log.recap?.took_34_restart && (
            <text x="620" y="70" fontSize="9" fontWeight="bold" fill="#0284c7">
              [34h Restart Taken Today]
            </text>
          )}

          {/* Signature Line */}
          <g transform="translate(620, 100)">
            <text x="0" y="0" fontSize="10" fontWeight="bold" fill="#000000">
              Driver&apos;s Signature:
            </text>
            <text x="120" y="0" fontSize="11" fontStyle="italic" fill="#000000">
              {typedSignature ? `(Typed: ${typedSignature})` : ''}
            </text>
            <line x1="110" y1="4" x2="310" y2="4" stroke="#000000" strokeWidth="1" />
          </g>
        </g>
      </svg>

      {/* Interactive typed signature control below SVG in browser view */}
      <div className="no-print mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-2">
          <span>Sign Log (Type Name):</span>
          <input
            type="text"
            placeholder="Type driver full name"
            value={typedSignature}
            onChange={(e) => setTypedSignature(e.target.value)}
            className="px-2.5 py-1 border border-slate-300 rounded text-xs text-black focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <span className="text-[11px] text-slate-400">
          Generated via RouteWise • FMCSA 24h Paper Log Standard Format
        </span>
      </div>
    </div>
  );
};
