import { useEffect, useMemo, useState } from 'react';
import { Field } from './ui/input';
import { SearchSelect } from './ui/search-select';

// Danh sách tỉnh và phường lấy từ public/data/vn-provinces.json + vn-wards.json
// (nguồn: github.com/thanglequoc/vietnamese-provinces-database, mô hình 34 tỉnh
//  sau sáp nhất hành chính 2025). Mã tỉnh LUÔN đọc từ file dữ liệu để không lệch
// với khóa của danh sách phường.

// Tên tỉnh cũ (63 đơn vị) -> tên tỉnh mới, dùng để tự chọn lại khi
// người dùng đang xem địa chỉ lưu từ trước thay đổi hành chính.
const OLD_PROVINCE_ALIAS = {
  'hà nội': 'Thành phố Hà Nội', 'thành phố hà nội': 'Thành phố Hà Nội', 'tp. hà nội': 'Thành phố Hà Nội',
  'tp hà nội': 'Thành phố Hà Nội', 'hn': 'Thành phố Hà Nội',
  'hà giang': 'Thành phố Hà Nội', 'thành phố hà giang': 'Thành phố Hà Nội',
  'cao bằng': 'Tỉnh Cao Bằng', 'thành phố cao bằng': 'Tỉnh Cao Bằng',
  'bắc cạn': 'Tỉnh Cao Bằng', 'thành phố bắc cạn': 'Tỉnh Cao Bằng',
  'tuyên quang': 'Tỉnh Tuyên Quang', 'thành phố tuyên quang': 'Tỉnh Tuyên Quang',
  'lào cai': 'Tỉnh Lào Cai', 'thành phố lào cai': 'Tỉnh Lào Cai',
  'điện biên': 'Tỉnh Điện Biên', 'thị xã mường lay': 'Tỉnh Điện Biên',
  'lai châu': 'Tỉnh Lai Châu',
  'sơn la': 'Tỉnh Sơn La',
  'yên bái': 'Tỉnh Sơn La', 'thị xã yên bái': 'Tỉnh Sơn La', 'hòa bình': 'Tỉnh Sơn La',
  'thái nguyên': 'Tỉnh Thái Nguyên', 'thành phố thái nguyên': 'Tỉnh Thái Nguyên',
  'lạng sơn': 'Tỉnh Lạng Sơn',
  'quảng ninh': 'Thành phố Quảng Ninh', 'thành phố quảng ninh': 'Thành phố Quảng Ninh', 'tp. quảng ninh': 'Thành phố Quảng Ninh',
  'bắc ninh': 'Thành phố Bắc Ninh', 'thành phố bắc ninh': 'Thành phố Bắc Ninh',
  'bắc giang': 'Thành phố Bắc Ninh', 'thành phố bắc giang': 'Thành phố Bắc Ninh',
  'tp. bắc ninh': 'Thành phố Bắc Ninh', 'tp bắc ninh': 'Thành phố Bắc Ninh', 'tp bắc giang': 'Thành phố Bắc Ninh',
  'phú thọ': 'Tỉnh Phú Thọ', 'thành phố việt trì': 'Tỉnh Phú Thọ',
  'vĩnh phúc': 'Tỉnh Phú Thọ', 'thành phố vĩnh yên': 'Tỉnh Phú Thọ', 'tp. vĩnh phúc': 'Tỉnh Phú Thọ',
  'hải phòng': 'Thành phố Hải Phòng', 'thành phố hải phòng': 'Thành phố Hải Phòng',
  'tp. hải phòng': 'Thành phố Hải Phòng', 'tp hải phòng': 'Thành phố Hải Phòng',
  'hưng yên': 'Tỉnh Hưng Yên', 'thành phố hưng yên': 'Tỉnh Hưng Yên', 'thái bình': 'Tỉnh Hưng Yên',
  'ninh bình': 'Tỉnh Ninh Bình', 'nam định': 'Tỉnh Ninh Bình', 'thành phố nam định': 'Tỉnh Ninh Bình',
  'tp. nam định': 'Tỉnh Ninh Bình', 'hà nam': 'Tỉnh Ninh Bình',
  'thanh hóa': 'Tỉnh Thanh Hoá', 'thành phố thanh hóa': 'Tỉnh Thanh Hoá', 'tp. thanh hóa': 'Tỉnh Thanh Hoá',
  'nghệ an': 'Tỉnh Nghệ An', 'vinh': 'Tỉnh Nghệ An', 'thành phố vinh': 'Tỉnh Nghệ An', 'tp. vinh': 'Tỉnh Nghệ An',
  'hà tĩnh': 'Tỉnh Hà Tĩnh',
  'quảng bình': 'Tỉnh Quảng Trị', 'thành phố đồng hới': 'Tỉnh Quảng Trị', 'tp. đồng hới': 'Tỉnh Quảng Trị',
  'quảng trị': 'Tỉnh Quảng Trị',
  'huế': 'Thành phố Huế', 'thành phố huế': 'Thành phố Huế', 'tp. huế': 'Thành phố Huế',
  'đà nẵng': 'Thành phố Đà Nẵng', 'thành phố đà nẵng': 'Thành phố Đà Nẵng', 'tp. đà nẵng': 'Thành phố Đà Nẵng',
  'quảng nam': 'Tỉnh Quảng Ngãi', 'quảng ngãi': 'Tỉnh Quảng Ngãi',
  'gia lai': 'Tỉnh Gia Lai',
  'bình định': 'Tỉnh Gia Lai', 'thành phố quy nhơn': 'Tỉnh Gia Lai', 'tp. quy nhơn': 'Tỉnh Gia Lai', 'phú yên': 'Tỉnh Gia Lai',
  'khánh hoà': 'Tỉnh Khánh Hoà', 'thành phố nha trang': 'Tỉnh Khánh Hoà', 'tp. nha trang': 'Tỉnh Khánh Hoà',
  'đắk lắk': 'Tỉnh Đắk Lắk', 'thành phố buôn ma thuột': 'Tỉnh Đắk Lắk', 'tp. buôn ma thuột': 'Tỉnh Đắk Lắk',
  'lâm đồng': 'Tỉnh Lâm Đồng', 'thành phố đà lạt': 'Tỉnh Lâm Đồng', 'tp. đà lạt': 'Tỉnh Lâm Đồng',
  'đắk nông': 'Tỉnh Lâm Đồng',
  'đồng nai': 'Thành phố Đồng Nai', 'thành phố biên hoà': 'Thành phố Đồng Nai',
  'tp. biên hoà': 'Thành phố Đồng Nai', 'tp biên hòa': 'Thành phố Đồng Nai',
  'bình dương': 'Thành phố Hồ Chí Minh', 'bình phước': 'Thành phố Hồ Chí Minh', 'long an': 'Thành phố Hồ Chí Minh',
  'hồ chí minh': 'Thành phố Hồ Chí Minh', 'thành phố hồ chí minh': 'Thành phố Hồ Chí Minh',
  'tp. hồ chí minh': 'Thành phố Hồ Chí Minh', 'tp hồ chí minh': 'Thành phố Hồ Chí Minh',
  'tây ninh': 'Tỉnh Tây Ninh', 'tp. tây ninh': 'Tỉnh Tây Ninh',
  'đồng tháp': 'Tỉnh Đồng Tháp',
  'vĩnh long': 'Tỉnh Vĩnh Long', 'tp. vĩnh long': 'Tỉnh Vĩnh Long',
  'an giang': 'Tỉnh An Giang', 'thành phố long xuyên': 'Tỉnh An Giang', 'tp. long xuyên': 'Tỉnh An Giang',
  'thành phị châu đốc': 'Tỉnh An Giang', 'tp. châu đốc': 'Tỉnh An Giang',
  'cần thơ': 'Thành phố Cần Thơ', 'thành phố cần thơ': 'Thành phố Cần Thơ', 'tp. cần thơ': 'Thành phố Cần Thơ',
  'tiền giang': 'Thành phố Cần Thơ', 'thành phố mỹ tho': 'Thành phố Cần Thơ', 'tp. mỹ tho': 'Thành phố Cần Thơ',
  'kiên giang': 'Tỉnh Cà Mau', 'thành phố rạch giá': 'Tỉnh Cà Mau', 'tp. rạch giá': 'Tỉnh Cà Mau',
  'bạc liêu': 'Tỉnh Cà Mau', 'tp. bạc liêu': 'Tỉnh Cà Mau', 'cà mau': 'Tỉnh Cà Mau',
};

const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

let provinceCache = null;
let wardCache = null;

const loadProvinces = () => {
  if (!provinceCache) {
    provinceCache = fetch('/data/vn-provinces.json')
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
  }
  return provinceCache;
};

export const loadWards = () => {
  if (!wardCache) {
    wardCache = fetch('/data/vn-wards.json')
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return wardCache;
};

/** Đoán mã tỉnh mới từ tên tỉnh đã lưu (địa chỉ cũ trước khi đổi mô hình). */
export function guessProvinceCode(name, provinces) {
  const k = norm(name);
  if (!k || !provinces?.length) return '';
  const target = OLD_PROVINCE_ALIAS[k] || OLD_PROVINCE_ALIAS[k.replace(/^(tỉnh|thành phố|thị xã|tp\.?|tp)\s*/i, '').trim()];
  if (target) {
    const hit = provinces.find((p) => p.name === target);
    if (hit) return hit.code;
  }
  const stripped = k.replace(/^(tỉnh|thành phố|thị xã|tp\.?|tp)\s*/i, '').trim();
  const direct = provinces.find((p) => norm(p.name) === k || norm(p.name).replace(/^(tỉnh|thành phố)\s*/i, '') === stripped);
  return direct ? direct.code : '';
}

export function ProvinceWardFields({
  provinceCode, provinceName, wardName, onChange,
  provinceLabel = 'Tỉnh / Thành phố', wardLabel = 'Xã / Phường',
}) {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState(null);

  useEffect(() => {
    let alive = true;
    loadProvinces().then((v) => { if (alive) setProvinces(v); });
    loadWards().then((m) => { if (alive) setWards(m); });
    return () => { alive = false; };
  }, []);

  const selected = provinceCode || guessProvinceCode(provinceName, provinces);
  const list = (selected && wards && wards[selected]) || [];

  // Địa chỉ lưu từ trước: tự chọn lại tỉnh để khách không phải chọn tay.
  useEffect(() => {
    if (provinceCode || !provinceName || !provinces.length) return;
    const guess = guessProvinceCode(provinceName, provinces);
    if (guess) onChange('province_code', guess);
  }, [provinceCode, provinceName, provinces, onChange]);

  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ value: p.code, label: p.name })),
    [provinces],
  );
  const wardOptions = useMemo(() => list.map((w) => ({ value: w.name, label: w.name })), [list]);

  return (
    <>
      <Field label={provinceLabel} required>
        <SearchSelect
          value={selected}
          options={provinceOptions}
          onChange={(code) => {
            onChange('province_code', code);
            onChange('province_name', (provinces.find((p) => p.code === code) || {}).name || '');
            onChange('ward_name', '');
          }}
          placeholder="Chọn tỉnh / thành phố"
          searchPlaceholder="Tìm tỉnh / thành phố..."
          ariaLabel={provinceLabel}
          required
          emptyText="Không tìm thấy tỉnh nào"
        />
      </Field>

      <Field label={wardLabel} required>
        <SearchSelect
          value={wardName || ''}
          options={wardOptions}
          onChange={(name) => onChange('ward_name', name)}
          disabled={!selected || !wards}
          placeholder={wards ? (selected ? 'Chọn xã / phường' : 'Chọn tỉnh trước') : 'Đang tải...'}
          searchPlaceholder="Tìm xã / phường..."
          ariaLabel={wardLabel}
          required
          emptyText={selected ? 'Tỉnh này chưa có dữ liệu xã phường' : 'Hãy chọn tỉnh trước'}
        />
      </Field>
    </>
  );
}
