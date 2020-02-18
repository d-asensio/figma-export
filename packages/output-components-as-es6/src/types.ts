import { FigmaExportType, FigmaExportPageNode } from '@figma-export/types';

export type OptionType = {
    componentName: string;
    pageName: string;
} & FigmaExportType;

export type TransformerType = (pages: Array<FigmaExportPageNode>) => Promise<void>;
export type OutputterType = (pages: FigmaExportPageNode[]) => Promise<void>;

export type OutputComponentsAsEs6OptionType = {
    output: string;
    useBase64?: boolean;
    useDataUrl?: boolean;
    getVariableName?: (options: OptionType) => string;
}
