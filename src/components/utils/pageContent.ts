import type { LocalizedContent } from "@venuecms/sdk-next";

/** Whether a body would put anything on screen. */
export const hasRenderableContent = (content?: LocalizedContent): boolean => {
  const doc = content?.contentJSON;

  // Mirrors VenueContent, which renders a present `contentJSON` and only falls
  // back to markdown without one — so an emptied doc beats a stale body.
  if (!doc) {
    return Boolean(content?.content?.trim());
  }

  const nodes = doc.content;

  // A cleared editor still saves a doc, holding one empty paragraph. Only a
  // paragraph is judged by its children; an image carries no text and is content.
  return (
    Array.isArray(nodes) &&
    nodes.some((node) => {
      const { type, content: children } = (node ?? {}) as {
        type?: string;
        content?: unknown;
      };

      return (
        type !== "paragraph" || (Array.isArray(children) && children.length > 0)
      );
    })
  );
};

type DocNode = { type?: string; attrs?: { level?: number }; content?: unknown };

const isHeading = (node: DocNode, level: number) =>
  node?.type === "heading" && node.attrs?.level === level;

/** Cuts nodes into runs, a new one starting at each heading of `level`. */
const splitNodes = (nodes: DocNode[], level: number): DocNode[][] =>
  nodes.reduce<DocNode[][]>((runs, node) => {
    if (isHeading(node, level) || runs.length === 0) {
      runs.push([node]);
    } else {
      runs[runs.length - 1].push(node);
    }
    return runs;
  }, []);

export type BodySection = {
  /** The h2 and whatever precedes its first h3, set at full width. */
  lead?: LocalizedContent;
  /** One entry per h3 under that h2, set side by side. */
  columns: LocalizedContent[];
};

/**
 * Groups a body by h2. Each group leads with its h2 (and any text before the
 * first h3 beneath it), followed by its h3 sections as columns. Text before
 * the first h2 is a group of its own. A markdown-only body comes back whole as
 * a single lead.
 */
export const splitSections = (content: LocalizedContent): BodySection[] => {
  const doc = content.contentJSON;
  const nodes = doc?.content;

  if (!doc || !Array.isArray(nodes)) {
    return [{ lead: content, columns: [] }];
  }

  const withNodes = (part: DocNode[]): LocalizedContent => ({
    ...content,
    contentJSON: { ...doc, content: part },
  });

  return splitNodes(nodes as DocNode[], 2).map((group) => {
    const firstH3 = group.findIndex((node) => isHeading(node, 3));
    const leadNodes = firstH3 === -1 ? group : group.slice(0, firstH3);
    const columnNodes = firstH3 === -1 ? [] : group.slice(firstH3);

    return {
      lead: leadNodes.length ? withNodes(leadNodes) : undefined,
      columns: splitNodes(columnNodes, 3).map(withNodes),
    };
  });
};
