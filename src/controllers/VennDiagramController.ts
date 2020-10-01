import {
  Chart,
  DatasetController,
  BarController,
  ITooltipItem,
  UpdateMode,
  ChartItem,
  ScriptableAndArrayOptions,
  IControllerDatasetOptions,
  ICommonHoverOptions,
  IChartConfiguration,
  ICartesianScaleTypeRegistry,
  ICoreChartOptions,
  LinearScale,
} from 'chart.js';
import { ArcSlice, IArcSliceOptions } from '../elements';
import layout, { IVennDiagramLayout } from '../model/layout';
import { IArcSlice, IBoundingBox, ICircle, IEllipse } from '../model/interfaces';
import patchController from './patchController';

export class VennDiagramController extends DatasetController<ArcSlice> {
  static readonly id: string = 'venn';

  static readonly defaults = {
    tooltips: {
      callbacks: {
        title() {
          // Title doesn't make sense for scatter since we format the data as a point
          return '';
        },
        label(item: ITooltipItem) {
          const labels = item.chart.data.labels! as string[];
          const d = item.chart.data.datasets![item.datasetIndex].data![item.dataIndex]! as any;
          return `${labels[item.dataIndex]}: ${d.values || d.value.toLocaleString()}`;
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        min: -1,
        max: 1,
        display: false,
      },
      y: {
        type: 'linear',
        min: -1,
        max: 1,
        display: false,
      },
    },
    dataElementType: ArcSlice.id,
    dataElementOptions: BarController.defaults.dataElementOptions,
  };

  initialize() {
    super.initialize();
    this.enableOptionSharing = true;
  }

  update(mode: UpdateMode) {
    super.update(mode);
    const meta = this._cachedMeta;
    const slices = ((meta.data || []) as unknown) as ArcSlice[];
    this.updateElements(slices, 0, slices.length, mode);
  }

  protected computeLayout(size: IBoundingBox): IVennDiagramLayout {
    const nSets = Math.log2(this._cachedMeta.data.length + 1);
    return layout(nSets, size);
  }

  updateElements(slices: ArcSlice[], start: number, count: number, mode: UpdateMode) {
    const xScale = this._cachedMeta.xScale as { left: number; right: number };
    const yScale = this._cachedMeta.yScale as { top: number; bottom: number };

    const w = xScale.right - xScale.left;
    const h = yScale.bottom - yScale.top;

    const l = this.computeLayout({
      x: xScale.left,
      y: yScale.top,
      width: w,
      height: h,
    });
    (this._cachedMeta as any)._layout = l;
    (this._cachedMeta as any)._layoutFont = (xScale as any)._resolveTickFontOptions(0);

    const firstOpts = this.resolveDataElementOptions(start, mode);
    const sharedOptions = this.getSharedOptions(firstOpts) as any;
    const includeOptions = this.includeOptions(mode, sharedOptions);

    for (let i = start; i < start + count; i++) {
      const slice = slices[i];
      const properties: IArcSlice & { options?: IArcSliceOptions; refs: (ICircle | IEllipse)[] } = Object.assign(
        {
          refs: l.sets,
        },
        l.intersections[i]
      );
      if (includeOptions) {
        properties.options =
          sharedOptions || ((this.resolveDataElementOptions(i, mode) as unknown) as IArcSliceOptions);
      }
      this.updateElement(slice, i, properties as any, mode);
    }
    this.updateSharedOptions(sharedOptions, mode, firstOpts);
  }

  draw() {
    const meta = this._cachedMeta;
    const elements = meta.data;

    const ctx = this.chart.ctx;
    elements.forEach((elem) => elem.draw(ctx));

    ctx.save();

    const l = (meta as any)._layout as IVennDiagramLayout;
    const font = (meta as any)._layoutFont;
    ctx.textBaseline = 'middle';
    ctx.font = font.string;
    ctx.fillStyle = font.color;
    ctx.textBaseline = 'middle';
    const labels = this.chart.data.labels! as string[];
    l.sets.forEach((set, i) => {
      ctx.textAlign = set.align === 'middle' ? 'center' : set.align;
      ctx.textBaseline = set.verticalAlign;
      ctx.fillText(labels[i], set.text.x, set.text.y);
    });
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const values = (this.getDataset() as any).data as { value: number }[];
    l.intersections.forEach((l, i) => {
      ctx.fillText(values[i].value.toLocaleString(), l.text.x, l.text.y);
    });

    ctx.restore();
  }
}

export interface IVennDiagramControllerDatasetOptions
  extends IControllerDatasetOptions,
    ScriptableAndArrayOptions<IArcSliceOptions>,
    ScriptableAndArrayOptions<ICommonHoverOptions> {}

declare module 'chart.js' {
  enum ChartTypeEnum {
    venn = 'venn',
  }
  interface IChartTypeRegistry {
    venn: {
      chartOptions: ICoreChartOptions;
      datasetOptions: IVennDiagramControllerDatasetOptions;
      defaultDataPoint: number[];
      scales: keyof ICartesianScaleTypeRegistry;
    };
  }
}

export class VennDiagramChart<DATA extends unknown[] = number[], LABEL = string> extends Chart<'venn', DATA, LABEL> {
  static id = VennDiagramController.id as 'venn';

  constructor(item: ChartItem, config: Omit<IChartConfiguration<'venn', DATA, LABEL>, 'type'>) {
    super(item, patchController('venn', config, VennDiagramController, ArcSlice, [LinearScale]));
  }
}
