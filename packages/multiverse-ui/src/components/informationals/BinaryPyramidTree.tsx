import Tree, {
  type RawNodeDatum,
  type RenderCustomNodeElementFn,
} from "react-d3-tree";
import { HiUserCircle, HiPlus } from "react-icons/hi2";
import { useRef, useCallback, useState, useEffect } from "react";

import Text from "./Text";
import Badge from "./Badge";
import Avatar from "./Avatar";
import { Stack } from "../containers";
import { Button } from "../input_controls";
import { type BinaryPyramidNode } from "./BinaryPyramidVis";
import { cn } from "../../utilities";

type TreeNode = {
  user_id: number;
  name: string;
  package: string;
  package_id: string;
  position: null;
  created_at: string;
};

type Props = {
  data: BinaryPyramidNode<TreeNode>;
  onAddChildClick: ({
    parentNode,
    position,
  }: {
    parentNode: BinaryPyramidNode<TreeNode>;
    position: "left" | "right" | null;
  }) => void;
};

// Store original node data in a map for lookup during rendering
type NodeDataMap = Map<
  string,
  {
    node: BinaryPyramidNode<TreeNode>;
    position: "left" | "right" | null;
    parentNode: BinaryPyramidNode<TreeNode> | null;
  }
>;

// Transform BinaryPyramidNode to RawNodeDatum format for react-d3-tree
const transformToRawNodeDatum = (
  node: BinaryPyramidNode<TreeNode> | null,
  parentNode: BinaryPyramidNode<TreeNode> | null = null,
  position: "left" | "right" | null = null,
  nodeMap: NodeDataMap,
  level: number = 0,
  MIN_LEVELS: number = 6,
): RawNodeDatum | null => {
  if (!node) {
    // Create placeholder node for empty slots if we're below MIN_LEVELS
    // Placeholders don't have children - they're just empty slots
    if (level < MIN_LEVELS && parentNode) {
      return {
        name: "",
        attributes: {
          _isPlaceholder: true,
          _parentNode: JSON.stringify(parentNode),
          _position: position || "",
        },
        children: undefined,
      };
    }
    return null;
  }

  const nodeId = `node-${node.attributes?.user_id || node.name || Math.random()}`;

  // Store node data in map
  nodeMap.set(nodeId, { node, position, parentNode });

  const children: RawNodeDatum[] = [];

  // Transform left child (always include if below MIN_LEVELS)
  const leftChild = transformToRawNodeDatum(
    node.children[0],
    node,
    "left",
    nodeMap,
    level + 1,
    MIN_LEVELS,
  );
  if (leftChild) children.push(leftChild);

  // Transform right child (always include if below MIN_LEVELS)
  const rightChild = transformToRawNodeDatum(
    node.children[1],
    node,
    "right",
    nodeMap,
    level + 1,
    MIN_LEVELS,
  );
  if (rightChild) children.push(rightChild);

  return {
    name: node.name || "",
    attributes: {
      _nodeId: nodeId,
      _position: position || "",
      _hasLeftChild: node.children[0] !== null,
      _hasRightChild: node.children[1] !== null,
      _level: level,
    },
    children: children.length > 0 ? children : undefined,
  };
};

const BinaryPyramidTree = ({ data, onAddChildClick }: Props) => {
  const MIN_LEVELS = 6;
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 600 });
  const nodeDataMapRef = useRef<NodeDataMap>(new Map());

  // Update dimensions when container is available
  useEffect(() => {
    if (treeContainerRef.current) {
      setDimensions({
        width: treeContainerRef.current.clientWidth,
        height: treeContainerRef.current.clientHeight || 600,
      });
    }
  }, []);

  // Transform data for react-d3-tree
  // Clear and rebuild node map on data change
  useEffect(() => {
    nodeDataMapRef.current.clear();
  }, [data]);

  const treeData = transformToRawNodeDatum(
    data,
    null,
    null,
    nodeDataMapRef.current,
    0,
    MIN_LEVELS,
  );

  // Store root node in map if not already there
  useEffect(() => {
    if (
      treeData &&
      !nodeDataMapRef.current.has(treeData.attributes?._nodeId as string)
    ) {
      const rootNodeId = `node-${data.attributes?.user_id || data.name || "root"}`;
      nodeDataMapRef.current.set(rootNodeId, {
        node: data,
        position: null,
        parentNode: null,
      });
    }
  }, [treeData, data]);

  // Custom node renderer
  const renderCustomNodeElement: RenderCustomNodeElementFn = useCallback(
    ({ nodeDatum, hierarchyPointNode }) => {
      const nodeAttributes = nodeDatum.attributes || {};
      const nodeId = nodeAttributes._nodeId as string | undefined;
      const position =
        (nodeAttributes._position as "left" | "right" | null) || null;
      const isPlaceholder = nodeAttributes._isPlaceholder === true;
      const isRoot = hierarchyPointNode.depth === 0;
      const level = hierarchyPointNode.depth;

      // Get node data from map
      let nodeData: BinaryPyramidNode<TreeNode> | null = null;
      let parentNodeData: BinaryPyramidNode<TreeNode> | null = null;

      if (isPlaceholder) {
        // For placeholders, get parent node from attributes
        const parentNodeStr = nodeAttributes._parentNode as string;
        if (parentNodeStr) {
          parentNodeData = JSON.parse(
            parentNodeStr,
          ) as BinaryPyramidNode<TreeNode>;
        }
      } else if (isRoot) {
        // Root node - use data directly
        nodeData = data;
        parentNodeData = null;
      } else if (nodeId) {
        const nodeInfo = nodeDataMapRef.current.get(nodeId);
        if (nodeInfo) {
          nodeData = nodeInfo.node;
          parentNodeData = nodeInfo.parentNode;
        }
      }

      // Determine node color based on level and position
      const getNodeColor = () => {
        if (isRoot) return "bg-blue-100";
        if (level === 1) return "bg-yellow-100";
        if (level === 2) {
          if (position === "left") return "bg-orange-100";
          return "bg-green-100";
        }
        if (level === 3) {
          if (position === "left") return "bg-red-100";
          return "bg-purple-100";
        }
        return "bg-gray-100";
      };

      // Determine indicator color
      const getIndicatorColor = () => {
        if (level === 0) return "bg-blue-500";
        if (level === 1) return "bg-yellow-500";
        if (level === 2 && position === "left") return "bg-orange-500";
        if (level === 2 && position === "right") return "bg-green-500";
        if (level === 3 && position === "left") return "bg-pink-500";
        if (level === 3 && position === "right") return "bg-purple-500";
        return "bg-gray-500";
      };

      return (
        <g>
          <foreignObject x={-75} y={-50} width={150} height={100}>
            <div
              className={cn(
                "w-full h-full p-2 flex flex-col relative space-y-1",
                "rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg border-2",
                isPlaceholder
                  ? "bg-transparent border-transparent"
                  : getNodeColor(),
                !isPlaceholder && "border-gray-300 shadow-sm",
              )}
            >
              {isPlaceholder && parentNodeData ? (
                <Button
                  size="lg"
                  variant="icon"
                  icon={HiPlus}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddChildClick({
                      parentNode: parentNodeData,
                      position,
                    });
                  }}
                  className="pointer-events-auto self-center"
                />
              ) : nodeData ? (
                <>
                  <button
                    type="button"
                    className="absolute inset-0 w-full h-full cursor-pointer"
                    onClick={() => {
                      // TODO: Implement node click handler
                    }}
                  >
                    <span className="sr-only">View node details</span>
                  </button>
                  {isRoot ? (
                    <HiUserCircle className="w-8 h-8 text-gray-700" />
                  ) : (
                    // <PiPersonFill className="w-8 h-8 text-gray-700" />
                    <Avatar
                      initials={nodeData.attributes.name.slice(0, 2)}
                      variant="initials"
                      size={24}
                      rounded
                    />
                  )}
                  <div
                    className={cn(
                      "absolute top-1 right-1 w-3 h-3 rounded-full",
                      getIndicatorColor(),
                    )}
                  />
                  <Text
                    size="caption"
                    weight="medium"
                    className="truncate max-w-[120px]"
                  >
                    {nodeData.attributes.name}
                  </Text>
                  <Text size="caption" color="subtle" className="text-xs">
                    {nodeData.attributes.user_id}
                  </Text>
                </>
              ) : null}
            </div>
          </foreignObject>
        </g>
      );
    },
    [data, onAddChildClick, MIN_LEVELS],
  );

  if (!treeData) {
    return null;
  }

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
              <Badge label="Strong Leg" intent="info" rounded />
            </Stack>
            <Text weight="bold">- EP</Text>
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
              <Badge label="Weak Leg" rounded />
            </Stack>
            <Text weight="bold">- EP</Text>
          </Stack>
        </Stack>
      </Stack>

      {/* Tree Section */}
      <Stack horizontal className="w-full">
        <div
          ref={treeContainerRef}
          className="grow h-[600px] bg-white relative"
          id="tree-container"
        >
          {treeData && dimensions.width > 0 && (
            <Tree
              data={treeData}
              orientation="vertical"
              renderCustomNodeElement={renderCustomNodeElement}
              pathFunc="step"
              translate={{ x: dimensions.width / 2, y: 50 }}
              zoom={0.3}
              scaleExtent={{ min: 0.5, max: 2 }}
              separation={{ siblings: 1, nonSiblings: 1.5 }}
              nodeSize={{ x: 200, y: 150 }}
              pathClassFunc={({ target }) => {
                // Traverse up the hierarchy to find the root's direct child (depth 1)
                let currentNode: typeof target | null = target;
                let rootSide: "left" | "right" | null = null;

                // Walk up the parent chain until we reach depth 1 (root's direct child)
                while (currentNode && currentNode.depth > 1) {
                  currentNode = currentNode.parent;
                }

                // If we found a node at depth 1, check its position relative to root
                if (currentNode && currentNode.depth === 1) {
                  const position = currentNode.data.attributes?._position as
                    | "left"
                    | "right"
                    | string
                    | undefined;
                  if (position === "left") {
                    rootSide = "left";
                  } else if (position === "right") {
                    rootSide = "right";
                  }
                }

                // Apply stroke color based on root-relative position
                if (rootSide === "left") {
                  return "stroke-red-300! stroke-3";
                }
                if (rootSide === "right") {
                  return "stroke-blue-500! stroke-3";
                }
                // Fallback for root node or edge cases
                return "stroke-gray-500! stroke-4";
              }}
            />
          )}
        </div>
      </Stack>
    </div>
  );
};

export default BinaryPyramidTree;
