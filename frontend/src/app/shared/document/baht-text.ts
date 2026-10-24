/** แปลงจำนวนเงินเป็นข้อความภาษาไทย เช่น 34,240.00 → สามหมื่นสี่พันสองร้อยสี่สิบบาทถ้วน */
export function bahtText(value: number | null | undefined): string {
  const num = Math.round((value ?? 0) * 100) / 100;
  const numArr = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const unitArr = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];
  const conv = (n: number): string => {
    let s = '';
    const str = String(n);
    const len = str.length;
    for (let i = 0; i < len; i++) {
      const d = +str[i];
      const p = len - 1 - i;
      if (d === 0) continue;
      if (p === 1 && d === 1) s += 'สิบ';
      else if (p === 1 && d === 2) s += 'ยี่สิบ';
      else if (p === 0 && d === 1 && len > 1) s += 'เอ็ด';
      else s += numArr[d] + unitArr[p];
    }
    return s;
  };
  const [intStr, decStr] = num.toFixed(2).split('.');
  const intNum = parseInt(intStr, 10);
  let baht = '';
  if (intNum === 0) {
    baht = 'ศูนย์';
  } else {
    const million = Math.floor(intNum / 1_000_000);
    const remainder = intNum % 1_000_000;
    if (million > 0) baht += conv(million) + 'ล้าน';
    if (remainder > 0) baht += conv(remainder);
  }
  let result = baht + 'บาท';
  const dec = parseInt(decStr, 10);
  result += dec === 0 ? 'ถ้วน' : conv(dec) + 'สตางค์';
  return result;
}
