// One photo attached to a shipment loading — multiple per shipment.
// File data lives in FileModel; this row is the join + ordering carrier.
export type TShipmentPhoto = {
  id: string;
  shipmentId: string;
  fileId: string;
  sequenceNo: number; // display / capture order
  createdAt: Date;
  updatedAt: Date;
};

export type TAddShipmentPhoto = {
  shipmentId: string;
  fileId: string;
};
