/**
 * ย้อมรูป (เช่น โลโก้ขาวดำ) ให้เป็นโทนสีเดียว แบบ duotone:
 * ส่วนที่มืดที่สุดกลายเป็นสี tone · ส่วนที่ขาวยังขาว · ระหว่างนั้นไล่ตามความสว่างเดิม · ความโปร่งใสคงเดิม
 *
 * ทำบน canvas แล้วได้รูปใหม่ (data URL) แทนการใช้ CSS filter/opacity เพราะ
 * - opacity ได้แค่เทากลาง ไม่ใช่โทนเดียวกับตัวหนังสือในเอกสาร (slate อมน้ำเงิน)
 * - เป็นรูปธรรมดา html-to-image เก็บลง PDF และตอนพิมพ์ได้ตรงกับบนจอแน่นอน
 */
export async function tintToTone(src: string, tone: readonly [number, number, number]): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = pixels.data;
  const [tr, tg, tb] = tone;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    d[i] = tr + (255 - tr) * lum;
    d[i + 1] = tg + (255 - tg) * lum;
    d[i + 2] = tb + (255 - tb) * lum;
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas.toDataURL('image/png');
}
