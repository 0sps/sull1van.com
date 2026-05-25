/**
 * Sean's Log - PDF Export Module
 * Handles biomarker PDF report building, picker UI logic, and SVG rendering.
 */

(function () {
    // ── PDF STATE variables (formerly in index.html) ───────────────────
    let _pdfReportInProgress = false;
    let _pdfReportSelectedTests = new Set();
    let _pdfReportSelectedIndex = 0;

    // ── PUBLIC API EXPOSED TO GLOBAL SCOPE ─────────────────────────────
    window.openPdfReportPrompt = function () {
        if (!window.allTests || !window.allTests.length) {
            window.showConfirm({
                icon: window.CONFIRM_ICONS.info,
                iconColor: 'var(--accent)',
                title: 'No results available',
                body: 'Add or load lab results before generating a PDF report.',
                primary: { label: 'OK', className: 'confirm-btn-primary', action: window.dismissConfirm },
            });
            return;
        }

        _pdfReportSelectedTests = new Set();
        _pdfReportSelectedIndex = 0;
        const input = document.getElementById('reportSearchInput');
        if (input) input.value = '';

        renderPdfReportPicker();
        document.getElementById('reportOverlay')?.classList.add('visible');
        requestAnimationFrame(() => input?.focus({ preventScroll: true }));
    };

    window.closePdfReportPrompt = function () {
        document.getElementById('reportOverlay')?.classList.remove('visible');
    };

    window.togglePdfReportTest = function (name) {
        const test = window.allTests.find(item => item.name === name);
        if (!test) return;
        if (_pdfReportSelectedTests.has(test.name)) {
            _pdfReportSelectedTests.delete(test.name);
        } else {
            _pdfReportSelectedTests.add(test.name);
        }
        const input = document.getElementById('reportSearchInput');
        if (input) input.value = '';
        _pdfReportSelectedIndex = 0;
        renderPdfReportPicker();
        requestAnimationFrame(() => input?.focus({ preventScroll: true }));
    };

    window.removePdfReportTest = function (name) {
        _pdfReportSelectedTests.delete(name);
        renderPdfReportPicker();
    };

    window.onPdfReportSearchInput = function () {
        _pdfReportSelectedIndex = 0;
        renderPdfReportPicker();
    };

    window.handlePdfReportSearchKey = function (event) {
        const rows = getPdfReportRows();
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            _pdfReportSelectedIndex = Math.min(_pdfReportSelectedIndex + 1, Math.max(rows.length - 1, 0));
            renderPdfReportPicker();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            _pdfReportSelectedIndex = Math.max(_pdfReportSelectedIndex - 1, 0);
            renderPdfReportPicker();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const test = rows[_pdfReportSelectedIndex];
            if (test) window.togglePdfReportTest(test.name);
        } else if (event.key === 'Escape') {
            window.closePdfReportPrompt();
        }
    };

    window.generateSelectedPdfReport = function () {
        if (_pdfReportInProgress) return;
        _pdfReportInProgress = true;

        try {
            const report = getSelectedTestsForReport();

            if (!report.tests.length) {
                throw new Error('Search for and add at least one biomarker to the PDF report.');
            }

            const win = window.open('', '_blank');
            if (!win) {
                throw new Error('Your browser blocked the report window. Allow pop-ups for this site and try again.');
            }

            win.document.open();
            win.document.write(buildPdfReportHtml(report.title, report.tests));
            win.document.close();
            window.closePdfReportPrompt();
            window.showSuccessToast('Report ready');
        } catch (error) {
            console.error('PDF report failed:', error);
            window.showConfirm({
                icon: window.CONFIRM_ICONS.error,
                iconColor: 'var(--red)',
                title: 'Report failed',
                body: error.message || 'Something went wrong while preparing your PDF report.',
                primary: { label: 'OK', className: 'confirm-btn-primary', action: window.dismissConfirm },
            });
        } finally {
            _pdfReportInProgress = false;
        }
    };

    // ── PRIVATE / INTERNAL MODULE FUNCTIONS ────────────────────────────
    function getLocalStorageReportTestsByName(testName) {
        const normalizedTarget = window.normalizeTestName(testName);
        const matches = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key || key === 'health_enc_key') continue;
                const raw = localStorage.getItem(key);
                if (!raw || raw.length > 1500000) continue;
                let parsed;
                try { parsed = JSON.parse(raw); } catch (_) { continue; }

                const candidates = Array.isArray(parsed)
                    ? parsed
                    : Array.isArray(parsed?.tests)
                        ? parsed.tests
                        : [];
                const uiTests = window.buildUiTestsFromVault(candidates);
                uiTests.forEach(test => {
                    if (window.normalizeTestName(test.name) === normalizedTarget) matches.push(test);
                });
            }
        } catch (error) {
            console.warn('Local report lookup failed:', error);
        }
        return matches;
    }

    function getPdfReportRows() {
        const term = (document.getElementById('reportSearchInput')?.value || '').trim().toLowerCase();
        return window.allTests
            .filter(test => {
                if (!term) return true;
                return test.name.toLowerCase().includes(term) || (test.category || 'Other').toLowerCase().includes(term);
            })
            .sort((a, b) => {
                const aSelected = _pdfReportSelectedTests.has(a.name);
                const bSelected = _pdfReportSelectedTests.has(b.name);
                if (aSelected !== bSelected) return aSelected ? -1 : 1;
                return a.name.localeCompare(b.name);
            })
            .slice(0, 40);
    }

    function getPdfReportReadingSummary(test) {
        const first = test.points?.[0]?.date ? window.fmtDate(test.points[0].date) : '';
        const last = test.points?.[test.points.length - 1]?.date ? window.fmtDate(test.points[test.points.length - 1].date) : '';
        const count = test.points?.length || 0;
        const span = first && last && first !== last ? `${first} - ${last}` : (last || 'No date');
        return `${test.category || 'Other'} · ${count} reading${count === 1 ? '' : 's'} · ${span}`;
    }

    function renderPdfReportPicker() {
        const rows = getPdfReportRows();
        const selectedList = document.getElementById('reportSelectedList');
        const results = document.getElementById('reportResults');
        const generateBtn = document.querySelector('.report-btn-primary');
        _pdfReportSelectedIndex = Math.min(_pdfReportSelectedIndex, Math.max(rows.length - 1, 0));

        if (selectedList) {
            selectedList.innerHTML = _pdfReportSelectedTests.size
                ? [..._pdfReportSelectedTests].map(name => `
                    <div class="report-chip">
                        <span>${window.escStr(name)}</span>
                        <button type="button" data-report-remove="${window.escStr(name)}" onclick="removePdfReportTest(this.dataset.reportRemove)" aria-label="Remove ${window.escStr(name)}">×</button>
                    </div>
                `).join('')
                : '<div class="report-empty" style="width:100%;padding:12px 14px;">No biomarkers selected yet</div>';
        }

        if (results) {
            results.innerHTML = rows.length ? rows.map((test, index) => {
                const selected = _pdfReportSelectedTests.has(test.name);
                return `
                    <button class="report-result${index === _pdfReportSelectedIndex ? ' selected' : ''}${selected ? ' is-added' : ''}" type="button" data-report-test="${window.escStr(test.name)}" onclick="togglePdfReportTest(this.dataset.reportTest)">
                        <div>
                            <div class="report-result-name">${window.escStr(test.name)}</div>
                            <div class="report-result-meta">${window.escStr(getPdfReportReadingSummary(test))}</div>
                        </div>
                        <div class="report-result-action">${selected ? 'Added' : 'Add'}</div>
                    </button>
                `;
            }).join('') : '<div class="report-empty">No matching biomarkers</div>';
        }

        if (generateBtn) generateBtn.disabled = _pdfReportSelectedTests.size === 0;
    }

    function mergeReportTests(tests) {
        const byName = new Map();
        tests.filter(Boolean).forEach(test => {
            const key = window.normalizeTestName(test.name);
            if (!key) return;
            if (!byName.has(key)) {
                byName.set(key, { ...test, points: [...(test.points || [])] });
                return;
            }
            const existing = byName.get(key);
            existing.points = [...existing.points, ...(test.points || [])];
            existing.unitFallback = existing.unitFallback || test.unitFallback;
            existing.range = existing.range || test.range;
        });

        return [...byName.values()].map(test => {
            const seen = new Set();
            const points = [...(test.points || [])]
                .filter(point => point && point.date)
                .filter(point => {
                    const key = `${point.date}_${point.rawResult}_${point.lab}_${point.sourceFile}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                })
                .sort((a, b) => window.parseISODate(a.date) - window.parseISODate(b.date));
            const numericPts = points.filter(point => point.isNumeric && point.numVal !== null);
            const qualPts = points.filter(point => !point.isNumeric);
            const type = (numericPts.length === 0 && qualPts.length > 0)
                ? 'qualitative'
                : (numericPts.length > 0 && qualPts.length === 0 ? 'numeric' : 'mixed');
            const displayUnit = window.getDisplayUnitText(test) || window.findBestUnitText({ ...test, points });
            return {
                ...test,
                points,
                numericPts,
                type,
                displayUnit,
                unitStatus: displayUnit ? 'resolved' : 'absent',
            };
        }).filter(test => test.points.length);
    }

    function getSelectedTestsForReport() {
        const selectedNames = [..._pdfReportSelectedTests];
        const selectedTests = selectedNames.flatMap(name => {
            const direct = window.allTests.filter(test => test.name === name);
            const local = window.normalizeTestName(name) === 'TESTOSTERONE'
                ? getLocalStorageReportTestsByName('TESTOSTERONE')
                : [];
            return [...direct, ...local];
        });
        const tests = mergeReportTests(selectedTests).sort((a, b) => a.name.localeCompare(b.name));
        const title = tests.length === 1 ? `${tests[0].name} REPORT` : 'BIOMARKER REPORT';
        return {
            title,
            tests,
        };
    }

    function getReportLatestPoint(test) {
        const pts = test.type === 'qualitative' ? test.points : (test.numericPts.length ? test.numericPts : test.points);
        return pts[pts.length - 1] || null;
    }

    function getReportPointValue(point) {
        if (!point) return '—';
        return point.numVal !== null && point.numVal !== undefined
            ? window.formatVal(point.numVal)
            : String(point.rawResult ?? '—');
    }

    function getReportStatusText(test, point) {
        if (!point) return '—';
        if (point.isNumeric && point.numVal !== null) {
            const rangeStr = point.rawRange || test.range;
            const parsed = window.parseRange(rangeStr);
            const status = parsed ? window.isInRange(point.numVal, parsed) : null;
            return status ? status.toUpperCase() : 'RECORDED';
        }
        return window.qualBadge(window.qualStatus(point.rawResult));
    }

    function getReportStatusClass(statusText) {
        const status = String(statusText || '').toLowerCase();
        if (status.includes('normal') || status.includes('clear')) return 'status-good';
        if (status.includes('high') || status.includes('low') || status.includes('reactive')) return 'status-alert';
        return 'status-neutral';
    }

    function buildReportGraphSvg(test) {
        const pts = test.numericPts || [];
        if (pts.length < 2) {
            return '<div class="empty-graph">Not enough numeric readings for a trend graph.</div>';
        }

        const width = 680;
        const height = 168;
        const padX = 38;
        const padY = 22;
        const rangeStr = pts[pts.length - 1]?.rawRange || test.range;
        const parsed = window.parseRange(rangeStr);
        const values = pts.map(point => point.numVal);
        if (parsed?.min !== undefined) values.push(parsed.min);
        if (parsed?.max !== undefined) values.push(parsed.max);
        let min = Math.min(...values);
        let max = Math.max(...values);
        if (min === max) {
            min -= 1;
            max += 1;
        }
        const valueRange = max - min;
        const xFor = index => padX + (index / Math.max(1, pts.length - 1)) * (width - padX * 2);
        const yFor = value => height - padY - ((value - min) / valueRange) * (height - padY * 2);
        const coords = pts.map((point, index) => `${xFor(index).toFixed(1)},${yFor(point.numVal).toFixed(1)}`).join(' ');
        const dots = pts.map((point, index) => {
            const status = parsed ? window.isInRange(point.numVal, parsed) : null;
            const cls = status === 'normal' ? 'good' : status === 'high' || status === 'low' ? 'alert' : 'neutral';
            return `<circle class="${cls}" cx="${xFor(index).toFixed(1)}" cy="${yFor(point.numVal).toFixed(1)}" r="4.5" />`;
        }).join('');
        let rangeBand = '';
        if (parsed) {
            let bandTop = padY;
            let bandBottom = height - padY;
            if (parsed.min !== undefined && parsed.max !== undefined) {
                bandTop = yFor(parsed.max);
                bandBottom = yFor(parsed.min);
            } else if (parsed.min !== undefined) {
                bandBottom = yFor(parsed.min);
            } else if (parsed.max !== undefined) {
                bandTop = yFor(parsed.max);
            }
            rangeBand = `<rect class="range-band" x="${padX}" y="${Math.min(bandTop, bandBottom).toFixed(1)}" width="${width - padX * 2}" height="${Math.abs(bandBottom - bandTop).toFixed(1)}" />`;
        }
        const rangeLines = parsed ? [
            parsed.min !== undefined ? `<line class="range-line" x1="${padX}" y1="${yFor(parsed.min).toFixed(1)}" x2="${width - padX}" y2="${yFor(parsed.min).toFixed(1)}" /><text class="range-label" x="${width - padX - 34}" y="${(yFor(parsed.min) - 4).toFixed(1)}">Min</text>` : '',
            parsed.max !== undefined ? `<line class="range-line" x1="${padX}" y1="${yFor(parsed.max).toFixed(1)}" x2="${width - padX}" y2="${yFor(parsed.max).toFixed(1)}" /><text class="range-label" x="${width - padX - 34}" y="${(yFor(parsed.max) - 4).toFixed(1)}">Max</text>` : '',
        ].join('') : '';

        return `
            <svg class="report-graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="${window.escStr(test.name)} history graph">
                <line class="axis" x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" />
                <line class="axis" x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}" />
                <text class="axis-label" x="${padX}" y="18">${window.formatVal(max)}</text>
                <text class="axis-label" x="${padX}" y="${height - 7}">${window.formatVal(min)}</text>
                ${rangeBand}
                ${rangeLines}
                <polyline points="${coords}" />
                ${dots}
            </svg>
            <div class="graph-dates">
                <span>${window.escStr(window.fmtDate(pts[0].date))}</span>
                <span>${window.escStr(window.fmtDate(pts[pts.length - 1].date))}</span>
            </div>
        `;
    }

    function buildPdfReportHtml(title, tests) {
        const generatedAt = new Date().toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const summaryRows = tests.map(test => {
            const latest = getReportLatestPoint(test);
            const unit = window.getDisplayUnitText(test) || window.findBestUnitText(test);
            const statusText = getReportStatusText(test, latest);
            return `
                <tr>
                    <td>${window.escStr(test.name)}</td>
                    <td>${window.escStr(getReportPointValue(latest))}</td>
                    <td>${window.escStr(unit || '—')}</td>
                    <td>${window.escStr(latest?.date ? window.fmtDate(latest.date) : '—')}</td>
                    <td><span class="status-pill ${getReportStatusClass(statusText)}">${window.escStr(statusText)}</span></td>
                </tr>
            `;
        }).join('');

        const sections = tests.map(test => {
            const unit = window.getDisplayUnitText(test) || window.findBestUnitText(test);
            const latest = getReportLatestPoint(test);
            const statusText = getReportStatusText(test, latest);
            const history = [...(test.type === 'qualitative' ? test.points : (test.numericPts.length ? test.numericPts : test.points))]
                .reverse()
                .map(point => `
                    <tr>
                        <td>${window.escStr(window.fmtDate(point.date))}</td>
                        <td>${window.escStr(getReportPointValue(point))}</td>
                        <td>${window.escStr(unit || '—')}</td>
                        <td>${window.escStr(point.rawRange || test.range || '—')}</td>
                    </tr>
                `).join('');
            return `
                <section class="marker-section">
                    <div class="marker-heading">
                        <div>
                            <h2>${window.escStr(test.name)}</h2>
                            <span>${window.escStr((test.points || []).length)} reading${(test.points || []).length === 1 ? '' : 's'}${unit ? ` · ${window.escStr(unit)}` : ''}</span>
                        </div>
                        <div class="marker-latest">
                            <strong>${window.escStr(getReportPointValue(latest))}</strong>
                            <span class="status-pill ${getReportStatusClass(statusText)}">${window.escStr(statusText)}</span>
                        </div>
                    </div>
                    ${buildReportGraphSvg(test)}
                    <table class="history-table">
                        <thead><tr><th>Date</th><th>Result</th><th>Unit</th><th>Reference Range</th></tr></thead>
                        <tbody>${history}</tbody>
                    </table>
                </section>
            `;
        }).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${window.escStr(title)}</title>
<style>
    @page { size: letter; margin: 0.38in; }
    * { box-sizing: border-box; }
    :root {
        --ink: #f8fbff;
        --paper: #f6f8fb;
        --text: #0d1628;
        --muted: #65758c;
        --line: #dfe6ef;
        --panel: #ffffff;
        --panel-soft: #f8fbff;
        --navy: #07111f;
        --blue: #177ddc;
        --teal: #17a398;
        --green: #12805c;
        --red: #c24137;
        --amber: #b7791f;
    }
    body {
        margin: 0;
        background: var(--paper);
        color: var(--text);
        font-family: "Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    .page {
        max-width: 8.5in;
        min-height: 11in;
        margin: 0 auto;
        padding: 0;
        background:
            radial-gradient(circle at 12% 0%, rgba(23,125,220,0.14), transparent 28%),
            linear-gradient(180deg, #ffffff 0%, var(--paper) 100%);
    }
    header {
        padding: 26px 30px 22px;
        color: #fff;
        background:
            radial-gradient(circle at 90% 0%, rgba(23,163,152,0.55), transparent 36%),
            linear-gradient(135deg, #07111f 0%, #0b1d32 54%, #113f67 100%);
        border-radius: 0 0 22px 22px;
        box-shadow: 0 18px 50px rgba(7,17,31,0.22);
    }
    .eyebrow {
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        opacity: 0.76;
        font-weight: 800;
    }
    h1 {
        margin: 7px 0 9px;
        font-size: 31px;
        line-height: 1;
        letter-spacing: 0;
    }
    .meta {
        display: flex;
        gap: 18px;
        color: rgba(255,255,255,0.82);
        font-size: 12px;
        font-weight: 650;
    }
    main { padding: 22px 30px 30px; }
    .section-title {
        margin: 0 0 10px;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
    }
    table {
        width: 100%;
        border-collapse: collapse;
    }
    .summary-table {
        overflow: hidden;
        border-radius: 10px;
        background: rgba(255,255,255,0.92);
        box-shadow: 0 0 0 1px var(--line), 0 12px 28px rgba(15,23,42,0.06);
        margin-bottom: 16px;
    }
    th {
        background: #edf3f8;
        color: #4a5a70;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        text-align: left;
        padding: 8px 9px;
    }
    td {
        border-top: 1px solid var(--line);
        padding: 8px 9px;
        font-size: 11px;
        color: #172033;
        vertical-align: top;
    }
    td:first-child { font-weight: 760; color: #0f172a; }
    .status-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 56px;
        border-radius: 999px;
        padding: 3px 7px;
        font-size: 8.5px;
        font-weight: 850;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        white-space: nowrap;
    }
    .status-good {
        color: var(--green);
        background: rgba(18,128,92,0.1);
        box-shadow: inset 0 0 0 1px rgba(18,128,92,0.18);
    }
    .status-alert {
        color: var(--red);
        background: rgba(194,65,55,0.1);
        box-shadow: inset 0 0 0 1px rgba(194,65,55,0.18);
    }
    .status-neutral {
        color: var(--blue);
        background: rgba(23,125,220,0.1);
        box-shadow: inset 0 0 0 1px rgba(23,125,220,0.18);
    }
    .marker-section {
        break-inside: avoid;
        page-break-inside: avoid;
        padding: 14px;
        margin-top: 12px;
        border: 1px solid rgba(223,230,239,0.95);
        border-radius: 14px;
        background:
            linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,251,255,0.96));
        box-shadow: 0 10px 24px rgba(15,23,42,0.055);
    }
    .marker-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 8px;
    }
    h2 {
        margin: 0;
        font-size: 18px;
        line-height: 1.05;
        letter-spacing: 0;
        color: #0f172a;
    }
    .marker-heading > div:first-child > span {
        display: inline-block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 10px;
        font-weight: 760;
    }
    .marker-latest {
        min-width: 88px;
        text-align: right;
    }
    .marker-latest strong {
        display: block;
        color: var(--navy);
        font-size: 18px;
        line-height: 1.05;
        font-weight: 850;
        margin-bottom: 4px;
    }
    .report-graph {
        width: 100%;
        height: 168px;
        display: block;
        margin: 4px 0 2px;
        border-radius: 12px;
        background: #f8fbff;
        box-shadow: inset 0 0 0 1px #dfe8f2;
    }
    .report-graph .axis {
        stroke: #c9d6e3;
        stroke-width: 1.25;
    }
    .report-graph .axis-label {
        fill: #6b7a90;
        font-size: 10px;
        font-weight: 700;
    }
    .report-graph .range-line {
        stroke: #aebdca;
        stroke-width: 1;
        stroke-dasharray: 4 4;
    }
    .report-graph .range-band {
        fill: rgba(18,128,92,0.07);
    }
    .report-graph .range-label {
        fill: #6b7a90;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }
    .report-graph polyline {
        fill: none;
        stroke: var(--teal);
        stroke-width: 2.25;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
    .report-graph circle {
        fill: var(--blue);
        stroke: #fff;
        stroke-width: 2;
    }
    .report-graph circle.good { fill: var(--green); }
    .report-graph circle.alert { fill: var(--red); }
    .report-graph circle.neutral { fill: var(--blue); }
    .graph-dates {
        display: flex;
        justify-content: space-between;
        color: var(--muted);
        font-size: 9.5px;
        font-weight: 700;
        margin-bottom: 8px;
    }
    .empty-graph {
        border-radius: 12px;
        background: #f8fbff;
        border: 1px dashed #c9d6e3;
        color: var(--muted);
        padding: 18px;
        text-align: center;
        font-size: 11px;
        font-weight: 700;
        margin-bottom: 8px;
    }
    .history-table th { background: #f5f8fc; }
    .history-table td { font-size: 10px; padding-top: 6px; padding-bottom: 6px; }
</style>
</head>
<body>
<div class="page">
    <header>
        <div class="eyebrow">Sean's Log</div>
        <h1>\${window.escStr(title)}</h1>
        <div class="meta">
            <span>Generated \${window.escStr(generatedAt)}</span>
            <span>\${tests.length} marker\${tests.length === 1 ? '' : 's'}</span>
        </div>
    </header>
    <main>
        <h2 class="section-title">Most Recent Results</h2>
        <table class="summary-table">
            <thead><tr><th>Marker</th><th>Most Recent</th><th>Unit</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>\${summaryRows}</tbody>
        </table>
        \${sections}
    </main>
</div>
<script>
    window.addEventListener('load', () => setTimeout(() => window.print(), 250));
<\/script>
</body>
</html>`;
    }
})();
