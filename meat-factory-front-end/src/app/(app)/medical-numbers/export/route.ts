import type { NextRequest } from "next/server";
import { utils, write } from "xlsx";
import { requireCap } from "@/lib/auth/server";
import { getClient } from "@/lib/apollo/server";
import { MedicalNumbersDoc } from "@/lib/queries/medical-number";
import { unwrapList } from "@/lib/unwrap";
import { fmtDate, fmtDateTime } from "@/lib/format/date";
import { MEDICAL_NUMBER_STATUS_MN } from "@/lib/format/enum";
import { getFactories } from "@/lib/factory/server";
import { factoryName } from "@/lib/factory/factories";
import type { Medical_Number_Status } from "@/lib/gql/graphql";

// ponytail: one 10k-row fetch; page through if a filter ever exceeds that.
const MAX_ROWS = 10_000;

// Same filters as the /medical-numbers page; `status` is the enum value
// (empty = all), resolved by the page's export link.
export async function GET(req: NextRequest) {
  await requireCap("MEDICAL_NUMBER_CHECK");
  const factories = await getFactories();
  const p = req.nextUrl.searchParams;

  const { data } = await getClient().query({
    query: MedicalNumbersDoc,
    variables: {
      status: (p.get("status") || null) as Medical_Number_Status | null,
      number: p.get("q") || null,
      factory: (p.get("factory") || null) as never,
      limit: MAX_ROWS,
      page: 1,
    },
  });
  const { rows, error } = unwrapList(
    data?.medicalNumbers,
    data?.medicalNumbers?.medicalNumbers,
  );
  if (error) return new Response(error, { status: 502 });

  // Every value is a string → stored as text, so a leading 0 in a number
  // survives (Excel would turn 0123456 into 123456).
  const sheet = utils.aoa_to_sheet([
    [
      "Дугаар",
      "Төлөв",
      "Бүртгэл",
      "Бүртгэсэн огноо",
      "Малчин",
      "Утас",
      "Үйлдвэр",
      "Шалгасан",
      "Шалгасан огноо",
    ],
    ...rows.map((n) => {
      const reg = n.registration;
      const status = n.status ?? "PENDING";
      return [
        n.number ?? "",
        MEDICAL_NUMBER_STATUS_MN[status] ?? status,
        reg?.registrationCode ?? "",
        fmtDate(reg?.intakeDate),
        reg?.herder?.name ?? "",
        reg?.herder?.phone ?? "",
        reg?.factory ? factoryName(factories, reg.factory) : "",
        n.checkedBy?.param ?? "",
        n.checkedAt ? fmtDateTime(n.checkedAt) : "",
      ];
    }),
  ]);
  sheet["!cols"] = [12, 12, 18, 14, 24, 12, 14, 16, 16].map((wch) => ({ wch }));
  const book = utils.book_new(sheet, "Эмнэлгийн дугаар");

  const date = new Date().toISOString().slice(0, 10);
  return new Response(write(book, { type: "array", bookType: "xlsx" }), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="medical-numbers-${date}.xlsx"`,
    },
  });
}
