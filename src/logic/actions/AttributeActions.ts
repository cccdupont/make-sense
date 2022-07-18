import {LabelsSelector} from '../../store/selectors/LabelsSelector';
import {ImageData, LabelName, LabelPolygon} from '../../store/labels/types';
import {store} from '../../index';
import {updateImageData} from '../../store/labels/actionCreators';

export class AttributeActions {

    public static labelExistsInLabelNames(label: string): boolean {
        const attributeNames: LabelName[] = LabelsSelector.getAttributeNames();
        return attributeNames
            .map((labelName: LabelName) => labelName.name)
            .includes(label)
    }

    public static removeAttributeNamesFromImageDatas(attributeNames: string[]) {
        const imagesData: ImageData[] = LabelsSelector.getImagesData();
        const newImagesData: ImageData[] = imagesData.map((imageData) => ({
            ...imageData,
            labelPolygons: imageData.labelPolygons.map((labelPolygon: LabelPolygon) => {
                return {
                    ...labelPolygon,
                    attributeNames: labelPolygon.attributeNames.filter((c) => !attributeNames.includes(c))
                }
            })
            
        }))
        store.dispatch(updateImageData(newImagesData));
    }

    public static updateAttributeNamesFromImageDatas(attributeNamesMap: { [name: string]: string }) {
        const imagesData: ImageData[] = LabelsSelector.getImagesData();
        const newImagesData: ImageData[] = imagesData.map((imageData) => ({
            ...imageData,
            labelPolygons: imageData.labelPolygons.map((labelPolygon: LabelPolygon) => {
                return {
                    ...labelPolygon,
                    attributeNames: labelPolygon.attributeNames.map((c) => attributeNamesMap[c])
                }
            })
            
        }));
        store.dispatch(updateImageData(newImagesData));
    }
}
