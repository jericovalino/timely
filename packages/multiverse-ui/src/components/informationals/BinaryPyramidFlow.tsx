import { useMemo, useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  Controls,
  Background,
  BackgroundVariant,
  Handle,
  Position,
} from "@xyflow/react";

import { type BinaryTree } from "@repo/utilities";

import Text from "./Text";
import Badge from "./Badge";
import Avatar from "./Avatar";
import { Stack } from "../containers";
import { cn } from "../../utilities";

import "@xyflow/react/dist/style.css";

const DEPTH = 6;
const NODE_WIDTH = 150; // Width of binary node in pixels

// Extract TreeNode type from BinaryTree
type TreeNode = BinaryTree["tree_data"];

// Type for ReactFlow node data
type FlowNodeData = {
  node: TreeNode | null;
  level: number;
  position: "left" | "right" | null;
  isPlaceholder?: boolean;
  parentNode?: TreeNode | null;
  onAddChildClick?: ({
    parentNode,
    position,
  }: {
    parentNode: TreeNode;
    position: "left" | "right" | null;
  }) => void;
};

// Type for ReactFlow Node
type FlowNode = Node<FlowNodeData>;

type Props = {
  data: BinaryTree;
  leftEntryPoints: number;
  rightEntryPoints: number;
  leftProductPoints: number;
  rightProductPoints: number;
  onAddChildClick: ({
    parentNode,
    position,
  }: {
    parentNode: TreeNode;
    position: "left" | "right" | null;
  }) => void;
};

// Hash function to convert string to deterministic number
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Generate deterministic colors from a string input
const generateNodeColors = (
  input: string,
): { background: string; border: string } => {
  const hash = hashString(input);

  // Generate hue from hash (0-360)
  const hue = hash % 360;

  // Background: light, moderately saturated
  const bgSaturation = 40 + (hash % 20); // 40-60%
  const bgLightness = 92 + (hash % 4); // 92-95%

  // Border: darker, more saturated
  const borderSaturation = 60 + (hash % 15); // 60-75%
  const borderLightness = 70 + (hash % 10); // 70-80%

  return {
    background: `hsl(${hue}, ${bgSaturation}%, ${bgLightness}%)`,
    border: `hsl(${hue}, ${borderSaturation}%, ${borderLightness}%)`,
  };
};

// Custom node component
const BinaryNode = (props: NodeProps<FlowNode>) => {
  const data = props.data;
  const { node } = data || ({} as FlowNodeData);

  // Render placeholder button
  // if (isPlaceholder && parentNode && onAddChildClick) {
  //   return (
  //     <div
  //       className={cn(
  //         "w-[150px] p-2 flex flex-col items-center justify-center relative",
  //         "rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg border-2",
  //         "border-transparent bg-transparent",
  //       )}
  //     >
  //       {/* Target handle for incoming edges */}
  //       <Handle
  //         id="top"
  //         type="target"
  //         position={Position.Top}
  //         style={{ background: "#555" }}
  //       />
  //       <Button
  //         size="lg"
  //         variant="icon"
  //         icon={HiPlus}
  //         onClick={(e) => {
  //           e.stopPropagation();
  //           onAddChildClick({
  //             parentNode,
  //             position,
  //           });
  //         }}
  //         className="pointer-events-auto self-center"
  //       />
  //     </div>
  //   );
  // }

  // Render regular node
  if (!node) {
    return null;
  }

  // Generate deterministic colors based on node name (or user_id as fallback)
  const colorInput = node.name || node.user_id.toString();
  const colors = generateNodeColors(colorInput);

  return (
    <div
      className={cn(
        "w-[150px] p-2 flex flex-col relative space-y-1",
        "rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg border-2",
        "shadow-sm",
      )}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
      }}
    >
      {/* Target handle for incoming edges */}
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        style={{ background: "#555" }}
      />

      <Avatar
        initials={node.name.slice(0, 2)}
        variant="initials"
        size={24}
        rounded
      />

      <div
        className="absolute top-1 right-1 w-3 h-3 rounded-full"
        style={{ backgroundColor: colors.border }}
      />

      <Text size="caption" weight="medium" className="truncate max-w-[120px]">
        {node.name}
      </Text>
      <Text size="caption" color="subtle" className="text-xs">
        {node.user_id}
      </Text>

      {/* Source handles for outgoing edges */}
      <Handle
        id="left"
        type="source"
        position={Position.Bottom}
        className="-translate-x-4 translate-y-1"
      />
      <Handle
        id="right"
        type="source"
        position={Position.Bottom}
        className="translate-x-4"
      />
    </div>
  );
};

const nodeTypes = {
  binaryNode: BinaryNode,
};

// Component to render split background overlay
const SplitBackground = ({
  nodes,
  viewportUpdateTrigger,
}: {
  nodes: FlowNode[];
  viewportUpdateTrigger: number;
}) => {
  const { getViewport } = useReactFlow();
  const [splitPosition, setSplitPosition] = useState<number | null>(null);

  // Find root node and calculate split position
  useEffect(() => {
    const rootNode = nodes.find(
      (node) => node.data?.level === 0 || node.data?.position === null,
    );

    if (rootNode) {
      // Get root node's flow x coordinate (constant regardless of viewport)
      const rootNodeX = rootNode.position.x;

      // Get current viewport state
      const viewport = getViewport();

      // Calculate screen position using viewport transform formula:
      // screenX = ((flowX + nodeWidth/2) * zoom) + viewportX
      // Adding NODE_WIDTH/2 to center the split on the root node's center
      const screenX = (rootNodeX + NODE_WIDTH / 2) * viewport.zoom + viewport.x;

      setSplitPosition(screenX);
    }
  }, [nodes, getViewport, viewportUpdateTrigger]);

  if (splitPosition === null) {
    return null;
  }

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to right, #eef2f8 0%, #eef2f8 ${splitPosition}px, white ${splitPosition}px, white 100%)`,
          zIndex: 0,
        }}
      />
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: `${splitPosition}px`,
          width: "2px",
          backgroundColor: "#3F64FF",
          zIndex: 1,
        }}
      />
    </>
  );
};

// Calculate tree depth
const getTreeDepth = (node: TreeNode | null, level: number = 0): number => {
  if (!node) return level;
  const leftDepth = getTreeDepth(node.left, level + 1);
  const rightDepth = getTreeDepth(node.right, level + 1);
  return Math.max(leftDepth, rightDepth);
};

// Transform TreeNode to ReactFlow nodes and edges
const transformToFlowNodes = (
  node: TreeNode | null,
  parentNode: TreeNode | null,
  level: number,
  x: number,
  width: number,
  verticalSpacing: number,
  onAddChildClick?: ({
    parentNode,
    position,
  }: {
    parentNode: TreeNode;
    position: "left" | "right" | null;
  }) => void,
): { nodes: FlowNode[]; edges: Edge[] } => {
  if (!node) {
    return { nodes: [], edges: [] };
  }

  const nodeId = `node-${node.user_id}`;
  const y = level * verticalSpacing;

  // Determine position relative to parent
  const position: "left" | "right" | null =
    parentNode === null ? null : parentNode.left === node ? "left" : "right";

  // For root node (no parent), center it at width/2
  // For child nodes, use the provided x position
  const nodeX = parentNode === null ? width / 2 : x;

  // Create current ReactFlow node
  const currentNode: FlowNode = {
    id: nodeId,
    type: "binaryNode",
    position: { x: nodeX, y },
    data: {
      node,
      level,
      position,
    },
  };

  const nodes: FlowNode[] = [currentNode];
  const edges: Edge[] = [];

  // Calculate child positions
  const childWidth = width / 2;
  const leftChildX = nodeX - width / 5;
  const rightChildX = nodeX + width / 5;
  const nextLevel = level + 1;

  // Process left child
  if (node.left) {
    const leftResult = transformToFlowNodes(
      node.left,
      node,
      nextLevel,
      leftChildX,
      childWidth,
      verticalSpacing,
      onAddChildClick,
    );
    nodes.push(...leftResult.nodes);
    edges.push(...leftResult.edges);

    // Create edge from current node to left child
    const leftChildId = leftResult.nodes[0]?.id;
    if (leftChildId) {
      edges.push({
        id: `edge-${nodeId}-left-${leftChildId}`,
        source: nodeId,
        target: leftChildId,
        sourceHandle: "left",
        targetHandle: "top",
        type: "bezier",
        style: { strokeWidth: 2 },
        pathOptions: { borderRadius: 8 },
      } as Edge);
    }
  } else if (nextLevel < DEPTH && onAddChildClick) {
    // Create placeholder node for missing left child
    const placeholderId = `placeholder-${nodeId}-left`;
    const placeholderY = nextLevel * verticalSpacing;
    nodes.push({
      id: placeholderId,
      type: "binaryNode",
      position: { x: leftChildX, y: placeholderY },
      data: {
        node: null,
        level: nextLevel,
        position: "left",
        isPlaceholder: true,
        parentNode: node,
        onAddChildClick,
      },
    } as FlowNode);

    // Create edge from current node to left placeholder
    edges.push({
      id: `edge-${nodeId}-left-${placeholderId}`,
      source: nodeId,
      target: placeholderId,
      sourceHandle: "left",
      targetHandle: "top",
      type: "bezier",
      style: { strokeWidth: 2 },
      pathOptions: { borderRadius: 8 },
    } as Edge);
  }

  // Process right child
  if (node.right) {
    const rightResult = transformToFlowNodes(
      node.right,
      node,
      nextLevel,
      rightChildX,
      childWidth,
      verticalSpacing,
      onAddChildClick,
    );
    nodes.push(...rightResult.nodes);
    edges.push(...rightResult.edges);

    // Create edge from current node to right child
    const rightChildId = rightResult.nodes[0]?.id;
    if (rightChildId) {
      edges.push({
        id: `edge-${nodeId}-right-${rightChildId}`,
        source: nodeId,
        target: rightChildId,
        sourceHandle: "right",
        targetHandle: "top",
        type: "bezier",
        style: { strokeWidth: 2 },
        pathOptions: { borderRadius: 8 },
      } as Edge);
    }
  } else if (nextLevel < DEPTH && onAddChildClick) {
    // Create placeholder node for missing right child
    const placeholderId = `placeholder-${nodeId}-right`;
    const placeholderY = nextLevel * verticalSpacing;
    nodes.push({
      id: placeholderId,
      type: "binaryNode",
      position: { x: rightChildX, y: placeholderY },
      data: {
        node: null,
        level: nextLevel,
        position: "right",
        isPlaceholder: true,
        parentNode: node,
        onAddChildClick,
      },
    } as FlowNode);

    // Create edge from current node to right placeholder
    edges.push({
      id: `edge-${nodeId}-right-${placeholderId}`,
      source: nodeId,
      target: placeholderId,
      sourceHandle: "right",
      targetHandle: "top",
      type: "bezier",
      style: { strokeWidth: 2 },
      pathOptions: { borderRadius: 8 },
    } as Edge);
  }

  return { nodes, edges };
};

const BinaryPyramidFlow = ({
  data,
  onAddChildClick,
  rightEntryPoints,
  leftEntryPoints,
  rightProductPoints,
  leftProductPoints,
}: Props) => {
  // Extract tree_data from BinaryTree
  const treeData = data.tree_data;

  // Transform data to nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const totalWidth = Math.max(1200, Math.pow(2, DEPTH) * 120);
    return transformToFlowNodes(
      treeData,
      null,
      0,
      0,
      totalWidth,
      200,
      onAddChildClick,
    );
  }, [treeData, onAddChildClick]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when data changes
  useEffect(() => {
    const totalWidth = Math.max(1200, Math.pow(2, DEPTH) * 120);
    const { nodes: newNodes, edges: newEdges } = transformToFlowNodes(
      treeData,
      null,
      0,
      0,
      totalWidth,
      200,
      onAddChildClick,
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }, [treeData, onAddChildClick, setNodes, setEdges]);

  useEffect(() => {
    console.log({
      nodes,
      edges,
    });
  }, [nodes, edges]);

  // Track viewport changes to update background split position
  const [viewportUpdateTrigger, setViewportUpdateTrigger] = useState(0);

  // Handle viewport changes to update background split
  const handleMove = useCallback(() => {
    setViewportUpdateTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="border-2 rounded-lg border-info overflow-hidden bg-info-subtle">
      {/* Header Section */}
      <Stack horizontal className="w-full">
        <Stack
          gap={4}
          className="grow grid grid-cols-2 h-[3.5rem] divide-x divide-white"
        >
          <Stack
            className="px-6 bg-blue-100"
            horizontal
            distribute="between"
            align="center"
          >
            <Stack horizontal align="center" gap={12}>
              <Text weight="bold" color="subtle">
                Left
              </Text>
              {leftEntryPoints < rightEntryPoints ? (
                <Badge label="Pay Leg" rounded intent="success" />
              ) : (
                <Badge label="Strong Leg" intent="info" rounded />
              )}
            </Stack>
            <Stack horizontal align="center" gap={12}>
              <Text weight="bold">{leftEntryPoints} EP</Text>
              <Text weight="bold" color="subtle">
                /
              </Text>
              <Text weight="bold">{leftProductPoints} PP</Text>
            </Stack>
          </Stack>
          <Stack
            className="px-6 bg-blue-100/50"
            horizontal
            distribute="between"
            align="center"
          >
            <Stack horizontal align="center" gap={12}>
              <Text weight="bold" color="subtle">
                Right
              </Text>
              {rightEntryPoints < leftEntryPoints ? (
                <Badge label="Pay Leg" rounded intent="success" />
              ) : (
                <Badge label="Strong Leg" intent="info" rounded />
              )}
            </Stack>
            <Stack horizontal gap={8}>
              <Text weight="bold">{rightEntryPoints} EP</Text>
              <Text weight="bold" color="subtle">
                /
              </Text>
              <Text weight="bold">{rightProductPoints} PP</Text>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      {/* ReactFlow Section */}
      <div className="w-full h-[600px] bg-white relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
          onMove={handleMove}
        >
          <SplitBackground
            nodes={nodes}
            viewportUpdateTrigger={viewportUpdateTrigger}
          />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default BinaryPyramidFlow;
