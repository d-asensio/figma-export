import * as Figma from 'figma-js';

import { basename, dirname } from 'path';
import {
    FigmaExportComponentNode,
    FigmaExportPageNode,
} from '@figma-export/types';

import {
    toArray,
    fetchAsSvgXml,
    promiseSequentially,
    fromEntries,
} from './utils';

const getComponents = (children: readonly SceneNode[] = []): FigmaExportComponentNode[] => {
    let components: FigmaExportComponentNode[] = [];

    children.forEach((component: any) => {
        if (component.type === 'COMPONENT') {
            components.push({
                ...component,
                figmaExport: {
                    dirname: dirname(component.name),
                    basename: basename(component.name),
                },
            });
            return;
        }

        components = [
            ...components,
            ...getComponents((component.children as ComponentNode[])),
        ];
    });

    return components;
};

const filterPagesByName = (pages: readonly PageNode[], pageNames: string | string[] = []): PageNode[] => {
    const only = toArray(pageNames).filter((p) => p.length);
    return pages.filter((page) => only.length === 0 || only.includes(page.name));
};

type FigmaExportPagesOptions = {
    only?: string | string[];
}

const getPages = (document: DocumentNode, options: FigmaExportPagesOptions = {}): FigmaExportPageNode[] => {
    const pages = filterPagesByName(document.children, options.only);

    return pages.map((page) => ({
        ...page,
        components: getComponents(page.children),
    }));
};

const getIdsFromPages = (pages: FigmaExportPageNode[]): string[] => pages.reduce((ids: string[], page) => [
    ...ids,
    ...page.components.map((component: ComponentNode) => component.id),
], []);

const getClient = (token: string): Figma.ClientInterface => {
    if (!token) {
        throw new Error('\'Access Token\' is missing. https://www.figma.com/developers/docs#authentication');
    }

    return Figma.Client({ personalAccessToken: token });
};

const fileImages = async (client: Figma.ClientInterface, fileId: string, ids: string[]): Promise<{readonly [key: string]: string}> => {
    const response = await client.fileImages(fileId, {
        ids,
        format: 'svg',
        // eslint-disable-next-line @typescript-eslint/camelcase
        svg_include_id: true,
    });

    return response.data.images;
};

type FigmaExportFileSvg = {
    [key: string]: string;
}

const fileSvgs = async (client: Figma.ClientInterface, fileId: string, ids: string[], svgTransformers: any[] = []): Promise<FigmaExportFileSvg> => {
    const images = await fileImages(client, fileId, ids);
    const svgPromises = Object.entries(images).map(async ([id, url]) => {
        const svg = await fetchAsSvgXml(url);
        const svgTransformed = await promiseSequentially(svgTransformers, svg);

        return [id, svgTransformed];
    });

    const svgs = await Promise.all(svgPromises);

    return fromEntries(svgs);
};

const enrichPagesWithSvg = async (client: Figma.ClientInterface, fileId: string, pages: FigmaExportPageNode[], svgTransformers: any[]):
    Promise<FigmaExportPageNode[]> => {
    const componentIds = getIdsFromPages(pages);

    if (componentIds.length === 0) {
        throw new Error('No components found');
    }

    const svgs = await fileSvgs(client, fileId, componentIds, svgTransformers);

    return pages.map((page) => ({
        ...page,
        components: page.components.map((component) => ({
            ...component,
            svg: svgs[component.id],
        })),
    }));
};

export {
    getComponents,
    getPages,
    getIdsFromPages,
    getClient,
    fileImages,
    fileSvgs,
    enrichPagesWithSvg,
};
