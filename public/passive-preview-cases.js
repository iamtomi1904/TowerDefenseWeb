// Explicit preview scenarios seed real combat conditions; they never fake a proc.
const c=(id,label,options={},description='')=>({id,label,options,description});
export const PASSIVE_PREVIEW_CASES={
 'dark-elf':[c('moon-stacks','Tích 8 tầng Nguyệt Ảnh',{mastery:0,seed:'empty'}),c('moon-extra','Đòn phụ ánh trăng',{mastery:2}),c('moon-break','Ba đòn phá giáp',{mastery:2,seed:'moon-break'})],
 'goblin-assassin':[c('backstab','Đánh sau lưng',{mastery:0}),c('stealth-strike','Ra đòn sau ẩn thân',{mastery:2,seed:'stealth'}),c('bleed-execute','Kết liễu mục tiêu chảy máu',{mastery:2,seed:'bleed'})],
 'knight-1':[c('reflect','Sóng khiên phản chấn',{mastery:0,seed:'reflect'}),c('shield-third','Tụ lực đòn thứ ba',{mastery:2}),c('phantom-shield','Giáp Ảo và phản chấn',{mastery:2,seed:'shield'})],
 'knight-2':[c('oath-foot','Thánh Ước · Bộ chiến',{mastery:0}),c('oath-third','Thánh Ước · Đòn thứ ba',{mastery:2}),c('oath-mounted','Thánh Ước · Thiên Mã',{mastery:2,mounted:true})],
 'knight-3':[c('dark-marks','Tích dấu và nổ Tha Hóa',{mastery:0}),c('dark-break','Phá giáp và chảy máu',{mastery:2}),c('dark-mounted','Tha Hóa · Dạng cưỡi',{mastery:2,mounted:true})],
 samurai:[c('wind-stacks','Tích 5 tầng Phong Tốc',{mastery:0,seed:'empty'}),c('wind-beam','Phóng phong kiếm khí',{mastery:2})],
 'samurai-commander':[c('critical','Nhất Kiếm · Chí mạng',{mastery:0}),c('critical-full','Nhất Kiếm · Đủ 20 tầng',{mastery:2,seed:'duel-full'}),c('dual-fourth','Song Kiếm · Chém phụ',{mastery:2,dual:true,seed:'dual'}),c('dual-full','Song Kiếm · Đủ 20 tầng',{mastery:2,dual:true,seed:'duel-full'})],
 'samurai-archer':[c('focus','Tích Tập Trung',{mastery:0,seed:'empty'}),c('double-shot','Liên xạ hai phát',{mastery:2}),c('piercing','Mũi tên xuyên phía sau',{mastery:2,seed:'piercing'})],
 'warrior-1':[c('war-stacks','Tích Chiến Ý khi đánh Boss',{mastery:0,seed:'empty'}),c('war-full','Đánh cường hóa đủ 5 tầng',{mastery:2})],
 'warrior-2':[c('blood-cleave','Chém lan và chảy máu',{mastery:0,seed:'healthy'}),c('blood-rage','Cuồng Nộ dưới 50% máu',{mastery:0}),c('blood-execute','Chém lực dưới 15% máu',{mastery:2})],
 'warrior-3':[c('sun-heal','Hút máu và Ý Chí Bất Khuất',{mastery:0}),c('spear-fourth','Đòn thứ tư đâm xuyên',{mastery:2}),c('giant-spear','Đâm xuyên · Cự Nhân',{mastery:2,seed:'giant'})],
 'fire-wizard':[c('burn','Tích tầng Hỏa Thiêu',{mastery:0,seed:'empty'}),c('burn-max','Hỏa Thiêu tinh thông',{mastery:2})],
 'lightning-mage':[c('charge','Tích điện và sét lan',{mastery:0,seed:'charge'}),c('charge-echo','Sét lan và sét đánh lại',{mastery:2,seed:'charge'})],
 'wanderer-magican':[c('water-stack','Tích bốn tầng Thủy Lưu',{mastery:0,seed:'empty'}),c('water-heal','Nước hồi máu một đồng minh',{mastery:0}),c('water-heal-two','Nước hồi máu hai đồng minh',{mastery:2,seed:'two-allies'})]
};
export const passiveCasesFor=hero=>PASSIVE_PREVIEW_CASES[hero]||[];
