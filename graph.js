const svg = d3.select("svg");

svg.on("contextmenu", () => {
    d3.event.preventDefault();
}).on("mousedown", () => {
    if (d3.event.button === 0) {
        const [fx, fy] = d3.mouse(d3.event.target);
        nodes.push({ fx, fy });
        update();
    }
});

const sim = d3.forceSimulation().force("link", d3.forceLink());

sim.on("tick", () => {
    node.attr("cx", data => data.x)
        .attr("cy", data => data.y);

    link.attr("x1", data => data.source.x)
        .attr("y1", data => data.source.y)
        .attr("x2", data => data.target.x)
        .attr("y2", data => data.target.y);
});

const drag = d3.drag().filter(() => d3.event.ctrlKey);

drag.on("start", (d, i, n) => {
    d3.select(n[i]).attr("cursor", "grabbing").raise();
    if (!d3.event.active) {
        sim.alphaTarget(0.25).restart();
    }
}).on("drag", (d) => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}).on("end", (d, i, n) => {
    d3.select(n[i]).attr("cursor", null);
    if (!d3.event.active) {
        sim.alphaTarget(0);
    }
});

let nodes = [], links = [];
let link = svg.append("g").selectAll("line");
let node = svg.append("g").selectAll("circle");

const update = () => {
    link = link.data(links)
               .join("line")
               .attr("class", "link")
               .attr("marker-end", "url(#arrowhead)")
               .on("mousedown", () => {
                   d3.event.stopPropagation();
               })
               .on("contextmenu", (d) => {
                   links.splice(d.index, 1);
                   update();
               });

    node = node.data(nodes)
               .join("circle")
               .attr("class", "node")
               .attr("r", 10)
               .call(drag)
               .on("mousedown", startDragLine)
               .on("mouseup", endDragLine)
               .on("contextmenu", (d) => {
                   nodes.splice(d.index, 1);
                   links = links.filter(l => l.source !== d && l.target !== d);
                   update();
               });

    sim.nodes(nodes);
    sim.force("link").links(links);
    sim.alpha(1).restart();
};

let sourceNode;

const startDragLine = (d) => {
    if (d3.event.button !== 0 || d3.event.ctrlKey)
        return;
    d3.event.stopPropagation();

    sourceNode = d;
    svg.insert("path", "g").attr("class", "dragLine");
};

const updateDragLine = () => {
    if(sourceNode) {
        const [x, y] = d3.mouse(d3.event.target);
        svg.select(".dragLine")
           .attr("d", `M ${sourceNode.x} ${sourceNode.y} L ${x} ${y}`);
    }
};

const hideDragLine = () => {
    sourceNode = null;
    svg.select(".dragLine").remove();
};

const endDragLine = (d) => {
    if(!sourceNode || sourceNode === d)
        return;

    if (links.some(l => l.source === sourceNode && l.target === d))
        return;

    links.push({ source: sourceNode, target: d });
    update();
};

svg.on("mousemove", updateDragLine)
   .on("mouseup", hideDragLine)
   .on("mouseleave", hideDragLine);
