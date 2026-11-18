package com.chp.invoice.document;

import com.chp.invoice.quotation.VatMode;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * ยอดเงินของใบแจ้งหนี้ / ใบเสร็จรับเงิน — VAT 3 แบบเหมือนใบเสนอราคา + ภาษีหัก ณ ที่จ่าย
 * <ul>
 *   <li>INCLUDED: ราคาที่กรอกรวม VAT แล้ว → ก่อน VAT = ยอดรวมย่อย × 100 / (100 + อัตรา), VAT = ส่วนต่าง
 *       (ใช้ส่วนต่างแทนการคูณอัตราตรง ๆ ให้ ก่อน VAT + VAT = ยอดรวมย่อย พอดีทุกสตางค์)</li>
 *   <li>EXCLUDED: บวก VAT เพิ่ม → VAT = ยอดรวมย่อย × อัตรา / 100, ทั้งหมด = ยอดรวมย่อย + VAT</li>
 *   <li>NONE: ไม่มี VAT → ทั้งหมด = ยอดรวมย่อย</li>
 * </ul>
 * ภาษีหัก ณ ที่จ่ายคิดจาก "ราคาก่อน VAT" เสมอ แล้วหักออกจากยอดทั้งหมด → จำนวนเงินที่ชำระ
 * ทุกขั้นปัด 2 ตำแหน่ง HALF_UP — frontend (shared/money.ts) คิดแบบเดียวกัน ยอดบนฟอร์มจึงตรงกับที่บันทึก
 */
public record DocumentTotals(
        BigDecimal beforeVat,
        BigDecimal vatAmount,
        BigDecimal grandTotal,
        BigDecimal whtAmount,
        BigDecimal netTotal
) {
    private static final int MONEY_SCALE = 2;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    public static DocumentTotals compute(BigDecimal subTotal, VatMode vatMode, BigDecimal vatRate, BigDecimal whtRate) {
        BigDecimal beforeVat;
        BigDecimal vatAmount;
        BigDecimal grandTotal;
        switch (vatMode) {
            case INCLUDED -> {
                beforeVat = subTotal.multiply(HUNDRED)
                        .divide(HUNDRED.add(vatRate), MONEY_SCALE, RoundingMode.HALF_UP);
                vatAmount = subTotal.subtract(beforeVat);
                grandTotal = subTotal;
            }
            case EXCLUDED -> {
                beforeVat = subTotal;
                vatAmount = subTotal.multiply(vatRate).divide(HUNDRED, MONEY_SCALE, RoundingMode.HALF_UP);
                grandTotal = subTotal.add(vatAmount);
            }
            default -> {
                beforeVat = subTotal;
                vatAmount = BigDecimal.ZERO.setScale(MONEY_SCALE);
                grandTotal = subTotal;
            }
        }
        BigDecimal whtAmount = beforeVat.multiply(whtRate).divide(HUNDRED, MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal netTotal = grandTotal.subtract(whtAmount).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        return new DocumentTotals(beforeVat, vatAmount, grandTotal, whtAmount, netTotal);
    }
}
