import {
    DataCellType,
    IconForDataCellType,
} from "./type_manager/members/MemberDataCell";

export default function ComponentLegend() {
    const items = Object.entries(DataCellType).map(([k, v]) => [
        k,
        <IconForDataCellType key={`${k}-icon`} type={v as DataCellType} />,
    ]);

    return (
        <div>
            {items.map(([text, icon]) => (
                <div key={text as string}>
                    {text} {icon}
                </div>
            ))}
        </div>
    );
}
