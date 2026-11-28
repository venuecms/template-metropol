import { Page } from "@venuecms/sdk-next";

export type PageWithParent = Page & { parentId?: string };
