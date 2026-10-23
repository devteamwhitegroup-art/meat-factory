// eBarimt via PosAPI (the system issues the herder's receipt itself) is
// parked until the tax-office setup is done — see the BE
// ebarimt.controller.ts. Meanwhile staff record by hand whether the receipt
// was taken (EbarimtCheckCard). true = bring back the herder ТТД field and the
// issue/void card.
export const EBARIMT_POSAPI = false;
