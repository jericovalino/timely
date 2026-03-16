import {
  useMemo,
  Children,
  useCallback,
  isValidElement,
  type FC,
  type ReactNode,
  type ReactElement,
  type ComponentPropsWithoutRef,
} from "react";

import CheckBox from "./CheckBox";
import FieldWrapper, {
  type Props as FieldWrapperProps,
} from "./../containers/FieldWrapper";
import Stack from "./../containers/Stack";
import { cn } from "./../../utilities";

const CHECKBOX_ITEM = "CheckBoxItem";
const SUBGROUP_ITEM = "SubGroupItem";
interface ComponentType {
  _TYPE: string;
}

function removeAttributes<T extends Record<string, unknown>>(
  obj: T,
  keysToRemove: string[], // no strict here
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keysToRemove.includes(key)),
  ) as Partial<T>;
}

type TCheckBoxItem = {
  value: string;
} & Pick<
  ComponentPropsWithoutRef<typeof CheckBox>,
  "label" | "value" | "description"
>;

type ItemComponent = FC<TCheckBoxItem> & ComponentType;
type SubGroupComponent = FC<TCheckBoxItem & { children: ReactNode }> &
  ComponentType;

export type TCheckBoxGroupValue = {
  label: string;
  value: string;
  data?: TCheckBoxGroupValue[];
};

/**
 * Props for the CheckBoxGroup component
 */
type TCheckBoxGroup = {
  value: TCheckBoxGroupValue[];
  id?: string;
  label: string;
  name: string;
  inline?: boolean;
  contained?: boolean;
  onChange: (_value: TCheckBoxGroupValue[]) => void;
  className?: string;
  children: Array<ReactElement<TCheckBoxItem>> | ReactElement<TCheckBoxItem>;
} & Omit<FieldWrapperProps, "inline">;

/**
 * CheckBoxGroup component for rendering hierarchical CheckBox selections.
 *
 * @component
 * @description A component for managing groups of CheckBoxes with parent-child relationships.
 * When a parent is checked/unchecked, all children inherit that state.
 * When some children are checked, the parent shows an indeterminate state.
 *
 * @param {object} props - Component props
 * @param {TCheckBoxGroupValue[]} props.value - Current selected values in hierarchical structure
 * @param {string} [props.id='CheckBox-group'] - Unique identifier for the component
 * @param {string} props.label - Label for the entire group
 * @param {string} props.name - Form name for the group
 * @param {boolean} [props.inline] - Whether to display label inline
 * @param {boolean} [props.contained=false] - Whether to apply container styling
 * @param {function} props.onChange - Handler for value changes
 * @param {string} [props.className] - Additional CSS classes
 * @param {ReactElement|ReactElement[]} props.children - CheckBoxGroup.Item and CheckBoxGroup.SubGroup components
 * @param {boolean} [props.readOnly=false] - Whether the group is read-only
 * @param {string} [props.error] - Error message to display
 *
 * @example
 * ```tsx
 * import CheckBoxGroup from './CheckBoxGroup';
 *
 * const [selection, setSelection] = useState([]);
 *
 * return (
 *   <CheckBoxGroup
 *     name="preferences"
 *     label="User Preferences"
 *     value={selection}
 *     onChange={setSelection}
 *   >
 *     <CheckBoxGroup.Item label="Email Notifications" value="email" />
 *     <CheckBoxGroup.SubGroup label="Newsletter" value="newsletter">
 *       <CheckBoxGroup.Item label="Weekly" value="weekly" />
 *       <CheckBoxGroup.Item label="Monthly" value="monthly" />
 *     </CheckBoxGroup.SubGroup>
 *     <CheckBoxGroup.Item label="SMS Notifications" value="sms" />
 *   </CheckBoxGroup>
 * );
 * ```
 *
 * @returns {JSX.Element} CheckBoxGroup component
 */
function CheckBoxGroup({
  value: v = [],
  label,
  name,
  error,
  inline,
  children,
  onChange,
  className,
  contained = false,
  readOnly = false,
  id = "CheckBox-group",
  ...rest
}: TCheckBoxGroup) {
  const values = useMemo(() => (Array.isArray(v) ? v : []), [v]);

  const OPTIONS = useMemo(() => {
    const y = (i: ReactElement<TCheckBoxItem>): TCheckBoxGroupValue => ({
      value: i?.props?.value,
      label: i.props.label!,
      data:
        "children" in i.props && i.props.children
          ? Children.map(i.props.children, (c2) => {
              if (!isValidElement(c2)) return null;
              return y(c2 as ReactElement<TCheckBoxItem>);
            }).filter(Boolean)
          : [],
    });
    return Children.map(children, (i) => {
      if (!isValidElement(i)) return null;
      return y(i as ReactElement<TCheckBoxItem>);
    }).filter(Boolean);
  }, [children]);

  // Creates a flat map of all values
  const flattenOptions = useCallback(
    (
      options: TCheckBoxGroupValue[] = OPTIONS,
    ): Record<string, TCheckBoxGroupValue> => {
      const result: Record<string, TCheckBoxGroupValue> = {};

      const traverse = (node: TCheckBoxGroupValue) => {
        result[node.value] = node;

        if (node.data && node.data.length > 0) {
          node.data.forEach(traverse);
        }
      };

      options.forEach(traverse);
      return result;
    },
    [OPTIONS],
  );

  // Create a flat map of all options for quick lookup
  const flatOptions = useMemo(() => flattenOptions(), [flattenOptions]);

  // Get the parent-child relationship map
  const parentChildMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    const parentMap: Record<string, string | null> = {};

    const buildMap = (
      nodes: TCheckBoxGroupValue[],
      parent: string | null = null,
    ) => {
      nodes.forEach((node) => {
        // Set parent relationship
        parentMap[node.value] = parent;

        // Set children relationship
        if (node.data && node.data.length > 0) {
          map[node.value] = node.data.map((child) => child.value);
          buildMap(node.data, node.value);
        } else {
          map[node.value] = [];
        }
      });
    };

    buildMap(OPTIONS);

    return { childrenMap: map, parentMap };
  }, [OPTIONS]);

  // Get selected values as a Set for faster lookup
  const selectedValuesSet = useMemo(() => {
    const selected = new Set<string>();

    const collectValues = (nodes: TCheckBoxGroupValue[]) => {
      nodes.forEach((node) => {
        selected.add(node.value);
        if (node.data) collectValues(node.data);
      });
    };

    collectValues(values);
    return selected;
  }, [values]);

  // Check if a value is selected
  const isSelected = useCallback(
    (value: string): boolean => selectedValuesSet.has(value),
    [selectedValuesSet],
  );

  // Get the direct children of a node
  const getDirectChildren = useCallback(
    (value: string): string[] => parentChildMap.childrenMap[value] || [],
    [parentChildMap.childrenMap],
  );

  // Get parent of a node
  const getParent = useCallback(
    (value: string): string | null => parentChildMap.parentMap[value] || null,
    [parentChildMap.parentMap],
  );

  // Get all descendants (children, grandchildren, etc.)
  const getAllDescendants = useCallback(
    (value: string): string[] => {
      const result: string[] = [];
      const children = getDirectChildren(value);

      if (children.length === 0) return result;

      children.forEach((childValue) => {
        result.push(childValue);
        result.push(...getAllDescendants(childValue));
      });

      return result;
    },
    [getDirectChildren],
  );

  // Check the state of children (all selected, some selected, none selected)
  const getChildrenState = useCallback(
    (value: string): { allSelected: boolean; someSelected: boolean } => {
      const children = getDirectChildren(value);

      if (children.length === 0) {
        return { allSelected: false, someSelected: false };
      }

      const allDescendants = getAllDescendants(value);
      const selectedCount = allDescendants.filter(isSelected).length;

      return {
        allSelected:
          selectedCount === allDescendants.length && allDescendants.length > 0,
        someSelected:
          selectedCount > 0 && selectedCount < allDescendants.length,
      };
    },
    [getDirectChildren, getAllDescendants, isSelected],
  );

  // Has any child selected (direct check, not recursive through descendants)
  const hasAnyChildSelected = useCallback(
    (value: string): boolean => {
      const children = getDirectChildren(value);
      return children.some(isSelected);
    },
    [getDirectChildren, isSelected],
  );

  // Convert flat selected values back to tree structure
  const buildTreeFromSelectedValues = useCallback(
    (selectedValues: Set<string>): TCheckBoxGroupValue[] => {
      // Helper function to build tree nodes
      const buildNode = (value: string): TCheckBoxGroupValue => {
        const option = flatOptions[value];
        const childValues = getDirectChildren(value);

        // Build node with selected children
        const node: TCheckBoxGroupValue = {
          value: option?.value ?? "",
          label: option?.label ?? "",
        };

        const selectedChildren = childValues
          .filter((childValue) => selectedValues.has(childValue))
          .map(buildNode);

        if (selectedChildren.length > 0) {
          node.data = selectedChildren;
        }

        return node;
      };

      // Only include root nodes that are selected
      return OPTIONS.filter((option) => selectedValues.has(option.value)).map(
        (option) => buildNode(option.value),
      );
    },
    [flatOptions, getDirectChildren, OPTIONS],
  );

  // Handle CheckBox change
  const handleOnChange = useCallback(
    (value: string) => {
      const newSelectedValues = new Set(selectedValuesSet);
      const isCurrentlySelected = newSelectedValues.has(value);

      // Toggle the clicked CheckBox
      if (isCurrentlySelected) {
        // If deselecting, remove this item and all descendants
        newSelectedValues.delete(value);
        getAllDescendants(value).forEach((descendant) => {
          newSelectedValues.delete(descendant);
        });
      } else {
        // If selecting, add this item and all descendants
        newSelectedValues.add(value);
        getAllDescendants(value).forEach((descendant) => {
          newSelectedValues.add(descendant);
        });

        // When selecting a child, ensure its parent chain is selected too
        let parent = getParent(value);
        while (parent) {
          newSelectedValues.add(parent);
          parent = getParent(parent);
        }
      }

      // Process to handle parent state based on children
      // If a parent has no selected children, unselect it as well
      const processParentStates = () => {
        let changed = false;

        // Create a copy of the Set to avoid modification during iteration
        const values = Array.from(newSelectedValues);

        for (const value of values) {
          const children = getDirectChildren(value);

          // Skip if it's a leaf node with no children
          if (children.length === 0) continue;

          // Check if any children are selected
          const hasSelectedChildren = children.some((child) =>
            newSelectedValues.has(child),
          );

          // If no children are selected but the parent is, unselect the parent
          if (!hasSelectedChildren && newSelectedValues.has(value)) {
            newSelectedValues.delete(value);
            changed = true;
          }
        }

        return changed;
      };

      // Keep running until we reach a stable state (no more changes)
      let stabilizing = true;
      while (stabilizing) {
        stabilizing = processParentStates();
      }

      // Build and pass the new tree structure
      const newValues = buildTreeFromSelectedValues(newSelectedValues);
      onChange(newValues);
    },
    [
      selectedValuesSet,
      getAllDescendants,
      buildTreeFromSelectedValues,
      onChange,
      getParent,
      getDirectChildren,
    ],
  );

  const isValidComponent = useCallback((child: ReactElement): boolean => {
    if (!isValidElement(child)) return false;

    const childType = child.type as Partial<ComponentType>;
    return (
      childType._TYPE === CHECKBOX_ITEM || childType._TYPE === SUBGROUP_ITEM
    );
  }, []);

  const renderChildren = useCallback(
    (child: ReactElement) => {
      if (!isValidComponent(child)) {
        // eslint-disable-next-line no-console
        console.error(
          "Invalid child passed to GroupCheckBox. Only GroupCheckBox.Item and GroupCheckBox.SubGroup are allowed.",
        );
        return null;
      }

      const { label, value, ...rest } = child.props as TCheckBoxItem & {
        children?: ReactNode;
      };

      // Check if this CheckBox is selected
      const checked = isSelected(value);

      // Determine if it has children
      const hasChildren = "children" in rest && Boolean(rest.children);

      // Determine its children's state
      const { allSelected, someSelected } = getChildrenState(value);

      // Calculate if it should be indeterminate
      // It should be indeterminate if some but not all children are selected
      const indeterminate = someSelected;

      // For a parent with children:
      // - It should be checked if all children are selected OR it's explicitly checked
      // - But if it has no selected children, it should NEVER be checked
      let isChecked = checked;
      if (hasChildren) {
        // If it has children, it's checked if:
        // 1. It's explicitly checked AND has at least one child selected
        // 2. OR all children are selected
        isChecked = (checked && hasAnyChildSelected(value)) || allSelected;
      }

      if (hasChildren) {
        return (
          <li className="space-y-2" key={value}>
            <CheckBox
              label={label}
              name={value}
              contained={contained}
              indeterminate={indeterminate}
              value={isChecked}
              disabled={readOnly}
              {...removeAttributes(rest, ["children"])}
              onChange={() => handleOnChange(value)}
            />
            <ul className="list-inside list-none space-y-2 pl-5">
              {Children.map(rest.children, (c2) =>
                c2 && isValidElement(c2) ? renderChildren(c2) : null,
              )}
            </ul>
          </li>
        );
      }

      return (
        <li key={value}>
          <CheckBox
            label={label}
            name={value}
            contained={contained}
            value={checked}
            disabled={readOnly}
            {...removeAttributes(rest, ["children"])}
            onChange={() => handleOnChange(value)}
          />
        </li>
      );
    },
    [
      isValidComponent,
      isSelected,
      getChildrenState,
      readOnly,
      handleOnChange,
      hasAnyChildSelected,
      contained,
    ],
  );

  return (
    <FieldWrapper
      id={id}
      name={name}
      label={!inline ? label : undefined}
      readOnly={readOnly}
      error={error}
      gap={8}
      {...rest}
    >
      <Stack
        gap={8}
        className={cn("flexgap-4", contained ? "w-full" : "w-auto")}
      >
        <ul className={cn("w-auto list-inside list-none space-y-2", className)}>
          {Children.map(children, (child) => renderChildren(child))}
        </ul>
      </Stack>
    </FieldWrapper>
  );
}

/**
 * Item component for CheckBoxGroup
 * Renders a single CheckBox option within the group
 *
 * @component
 * @description Renders a single CheckBox option within the group
 *
 * @param {object} props - Component props
 * @param {string} props.value - Value of the CheckBox
 * @param {string} props.label - Text label for the CheckBox
 * @param {string} [props.description] - Additional descriptive text
 *
 * @example
 * ```tsx
 * <CheckBoxGroup.Item
 *   label="Option name"
 *   value="option_value"
 *   description="Optional description"
 * />
 * ```
 *
 * @returns {null} This component doesn't render anything directly
 */
function Item(_props: TCheckBoxItem) {
  return null;
}

// Static identifier for the component type
(Item as ItemComponent)._TYPE = CHECKBOX_ITEM;

/**
 * SubGroup component for CheckBoxGroup
 * Creates a nested hierarchy of CheckBoxes with parent-child relationships
 *
 * @component
 * @description Creates a nested hierarchy of CheckBoxes with parent-child relationships.
 * When the parent is checked/unchecked, all children inherit that state.
 * When some children are checked, the parent shows an indeterminate state.
 *
 * @param {object} props - Component props
 * @param {string} props.value - Value of the parent CheckBox
 * @param {string} props.label - Text label for the parent CheckBox
 * @param {string} [props.description] - Additional descriptive text
 * @param {ReactNode} props.children - Child CheckBoxes (CheckBoxGroup.Item components)
 *
 * @example
 * ```tsx
 * <CheckBoxGroup.SubGroup label="Parent option" value="parent">
 *   <CheckBoxGroup.Item label="Child option 1" value="child1" />
 *   <CheckBoxGroup.Item label="Child option 2" value="child2" />
 * </CheckBoxGroup.SubGroup>
 * ```
 *
 * @returns {JSX.Element} SubGroup component
 */
function SubGroup(_props: TCheckBoxItem & { children: ReactNode }) {
  return <>{_props.children}</>;
}

// Static identifier for the component type
(SubGroup as SubGroupComponent)._TYPE = SUBGROUP_ITEM;

CheckBoxGroup.Item = Item;
CheckBoxGroup.SubGroup = SubGroup;

export default CheckBoxGroup;
