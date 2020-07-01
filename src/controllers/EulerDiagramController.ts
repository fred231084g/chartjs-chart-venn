import { Chart, patchControllerConfig, registerController } from '../chart';
import { IVennDiagramLayout } from '../model/layout';
import { VennDiagramController } from './VennDiagramController';
import euler from '../model/euler';
import { IBoundingBox } from '../model/interfaces';

export class EulerDiagramController extends VennDiagramController {
  static readonly id = 'euler';

  static readonly defaults = VennDiagramController.defaults;

  static register() {
    VennDiagramController.register();
    return registerController(EulerDiagramController);
  }

  protected computeLayout(size: IBoundingBox): IVennDiagramLayout {
    const sets = (this as any)._data as readonly { sets: readonly string[]; value: number }[];
    return euler(sets, size);
  }
}

export class EulerDiagramChart extends Chart {
  static readonly id = EulerDiagramController.id;

  constructor(item: any, config: any) {
    super(item, patchControllerConfig(config, EulerDiagramController));
  }
}
