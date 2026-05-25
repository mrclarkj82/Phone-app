const LABEL_OFFSET = 16;
const LABEL_INSET = 8;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getNumberAttribute(element, attribute) {
  return Number(element?.getAttribute(attribute) || 0);
}

function getSvgBounds(svg) {
  const viewBox = svg.viewBox?.baseVal;
  if (viewBox && viewBox.width && viewBox.height) {
    return {
      minX: viewBox.x + LABEL_INSET,
      minY: viewBox.y + LABEL_INSET,
      maxX: viewBox.x + viewBox.width - LABEL_INSET,
      maxY: viewBox.y + viewBox.height - LABEL_INSET,
    };
  }

  return {
    minX: LABEL_INSET,
    minY: LABEL_INSET,
    maxX: 260 - LABEL_INSET,
    maxY: 260 - LABEL_INSET,
  };
}

function chooseLabelPosition(svg, line, circle, pointIndex) {
  const x1 = getNumberAttribute(line, "x1");
  const y1 = getNumberAttribute(line, "y1");
  const x2 = getNumberAttribute(line, "x2");
  const y2 = getNumberAttribute(line, "y2");
  const vector = { x: x2 - x1, y: y2 - y1 };
  const length = Math.hypot(vector.x, vector.y) || 1;
  const normal = { x: -vector.y / length, y: vector.x / length };
  const base = {
    x: getNumberAttribute(circle, "cx"),
    y: getNumberAttribute(circle, "cy"),
  };
  const bounds = getSvgBounds(svg);
  const preferredSign = pointIndex === 0 ? 1 : -1;
  const candidates = [
    preferredSign * LABEL_OFFSET,
    -preferredSign * LABEL_OFFSET,
    preferredSign * (LABEL_OFFSET + 4),
    -preferredSign * (LABEL_OFFSET + 4),
  ].map((offset) => ({
    x: base.x + normal.x * offset,
    y: base.y + normal.y * offset,
  }));
  const chosen =
    candidates.find(
      (candidate) =>
        candidate.x >= bounds.minX &&
        candidate.x <= bounds.maxX &&
        candidate.y >= bounds.minY &&
        candidate.y <= bounds.maxY,
    ) || candidates[0];

  return {
    x: clamp(chosen.x, bounds.minX, bounds.maxX),
    y: clamp(chosen.y, bounds.minY, bounds.maxY),
  };
}

function repairCoordinateGraph(svg) {
  const line = svg.querySelector(".graph-line");
  const axisLabels = svg.querySelector(".axis-labels");
  const firstPoint = svg.querySelector(".graph-point");

  if (line && axisLabels) {
    if (firstPoint?.parentElement === svg) {
      svg.insertBefore(axisLabels, firstPoint);
    } else {
      svg.appendChild(axisLabels);
    }
  }

  if (!line) return;

  svg.querySelectorAll(".graph-point").forEach((group, index) => {
    const circle = group.querySelector("circle");
    const label = group.querySelector("text");
    if (!circle || !label) return;

    const position = chooseLabelPosition(svg, line, circle, index);
    label.setAttribute("x", position.x.toFixed(2));
    label.setAttribute("y", position.y.toFixed(2));
  });
}

function repairCoordinateGraphs(root = document) {
  if (!root.querySelectorAll) return;
  root.querySelectorAll(".coordinate-graph svg").forEach(repairCoordinateGraph);
}

export function startCoordinateGraphRepair() {
  if (typeof document === "undefined" || !document.body) return () => {};

  repairCoordinateGraphs();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          repairCoordinateGraphs(node);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
}
