import { PiPersonFill } from "react-icons/pi";
import { HiUserCircle, HiPlus } from "react-icons/hi2";

import { cn } from "../../utilities";
import { Stack } from "../containers";

import Text from "./Text";
import Badge from "./Badge";
import Avatar from "./Avatar";
import { Button } from "../input_controls";

export type BinaryPyramidNode<T> = {
  name?: string;
  attributes: Omit<T, "left" | "right">;
  left: BinaryPyramidNode<T> | null;
  right: BinaryPyramidNode<T> | null;
  children: [BinaryPyramidNode<T> | null, BinaryPyramidNode<T> | null];
};

type TreeNode = {
  user_id: number;
  name: string;
  package: string;
  package_id: string;
  position: null;
  created_at: string;
};

function getLevels<T>(node?: BinaryPyramidNode<T>): number {
  if (!node) return 0;
  const leftDepth = getLevels(node.children?.[0] ?? undefined);
  const rightDepth = getLevels(node.children?.[1] ?? undefined);
  return 1 + Math.max(leftDepth, rightDepth);
}

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

const BinaryPyramidVis = ({ data, onAddChildClick }: Props) => {
  const MIN_LEVELS = 6;
  const actualLevels = getLevels(data);
  const displayLevels = Math.max(MIN_LEVELS, actualLevels);

  type RenderNodeProps = {
    node: BinaryPyramidNode<TreeNode> | null;
    level: number;
    parentNode: BinaryPyramidNode<TreeNode> | null;
    position: "left" | "right" | null;
  };
  const renderNode = ({
    node,
    level,
    parentNode,
    position,
  }: RenderNodeProps) => {
    const shouldRenderPlaceholder = level < MIN_LEVELS && !node;
    const hasChildren = node && (node.children?.[0] || node.children?.[1]);
    const shouldRenderChildren = level + 1 < MIN_LEVELS || hasChildren;

    return (
      <div className="flex flex-col items-center justify-center w-full border-t border-info">
        <Stack
          horizontal
          gap={4}
          justify="center"
          className="h-[4.25rem] py-[1.125rem] px-0.5 grow w-full grid place-items-center group relative"
        >
          {node ? (
            <>
              <div
                className={cn(
                  "invisible group-hover:visible absolute bottom-full translate-y-2 left-1/2 -translate-x-1/2 bg-brand-50 w-40",
                  "rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg border-2 border-brand-500 p-2 cursor-pointer",
                )}
              >
                <div className="w-2 h-2 bg-brand-500 rounded-full absolute top-2 right-2" />
                <Avatar
                  initials={node.attributes.name.slice(0, 2)}
                  variant="initials"
                  size={24}
                  rounded
                />
                <Text className="mt-1 block" weight="semibold" size="caption">
                  {node.attributes.name}
                </Text>
                <Text className="mt-0.5" size="caption">
                  {node.attributes.user_id}
                </Text>
              </div>
              {level === 0 ? (
                <HiUserCircle className="w-8 h-8 group-hover:text-brand-500 transition-colors" />
              ) : (
                <>
                  {/* {node.attributes.is_direct ? ( */}
                  {true ? (
                    <PiPersonFill className="w-8 h-8 group-hover:text-brand-500 transition-colors" />
                  ) : (
                    <PiPersonFill className="w-8 h-8 text-gray-500" />
                  )}
                </>
              )}
            </>
          ) : shouldRenderPlaceholder ? (
            <>
              {parentNode ? (
                <Button
                  size="sm"
                  icon={HiPlus}
                  variant="icon"
                  onClick={() =>
                    onAddChildClick({
                      parentNode,
                      position,
                    })
                  }
                />
              ) : (
                <div className="w-8 h-8" />
              )}
            </>
          ) : null}
        </Stack>
        {shouldRenderChildren && (
          <div
            className={cn(
              "grid grid-cols-2 w-full divide-info",
              level === 0 ? "divide-x-2" : "divide-x",
            )}
          >
            {renderNode({
              node: node?.children?.[0] ?? null,
              level: level + 1,
              parentNode: node,
              position: "left",
            })}
            {renderNode({
              node: node?.children?.[1] ?? null,
              level: level + 1,
              parentNode: node,
              position: "right",
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border-2 rounded-lg border-info overflow-visible bg-info-subtle">
      <Stack horizontal className="w-full">
        <div className="h-[3.5rem] border-r border-info grid place-items-center bg-blue-100 w-6 shrink-0 rounded-tl-lg" />
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
            className="px-6 bg-blue-100/50 rounded-tr-lg"
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
      <Stack horizontal className="w-full">
        <Stack>
          {Array(displayLevels)
            .fill(0)
            .map((_, index) => (
              <Stack
                key={index}
                className={cn(
                  "border-r border-info grid place-items-center bg-blue-100 w-6 shrink-0 border-t flex-1",
                )}
              >
                <Text>{index}</Text>
              </Stack>
            ))}
        </Stack>
        <Stack className="grow">
          {renderNode({
            node: data,
            level: 0,
            parentNode: null,
            position: null,
          })}
        </Stack>
      </Stack>
    </div>
  );
};

export default BinaryPyramidVis;
