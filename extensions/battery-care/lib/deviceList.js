'use strict';
import * as Acer from '../devices/Acer.js';
import * as Apple from '../devices/Apple.js';
import * as Asahi from '../devices/Asahi.js';
import * as Asus from '../devices/Asus.js';
import * as Dell from '../devices/Dell.js';
import * as Gigabyte from '../devices/Gigabyte.js';
import * as Huawei from '../devices/Huawei.js';
import * as Lenovo from '../devices/Lenovo.js';
import * as Lg from '../devices/Lg.js';
import * as Msi from '../devices/Msi.js';
import * as Panasonic from '../devices/Panasonic.js';
import * as Razer from '../devices/Razer.js';
import * as QC71 from '../devices/QC71.js';
import * as Samsung from '../devices/Samsung.js';
import * as Sony from '../devices/Sony.js';
import * as System76 from '../devices/System76.js';
import * as Thinkpad from '../devices/Thinkpad.js';
import * as ThinkpadLegacy from '../devices/ThinkpadLegacy.js';
import * as Toshiba from '../devices/Toshiba.js';
import * as Tuxedo from '../devices/Tuxedo.js';
import * as Framework from '../devices/Framework.js';
import * as Librem from '../devices/Librem.js';
import * as Fujitsu from '../devices/Fujitsu.js';
import * as Chromebook from '../devices/Chromebook.js';
import * as GalaxyBook from '../devices/GalaxyBook.js';
import * as Acer2 from '../devices/Acer2.js';
import * as AcerNitro from '../devices/AcerNitro.js';
import * as AcerPredator from '../devices/AcerPredator.js';
import * as Apple2 from '../devices/Apple2.js';

export const deviceArray = [
    Asus.AsusSingleBatteryBAT0,
    Asus.AsusSingleBatteryBAT1,
    Asus.AsusSingleBatteryBATC,
    Asus.AsusSingleBatteryBATT,
    Lg.LgSingleBattery,
    Samsung.SamsungSingleBattery,
    Sony.SonySingleBattery,
    Huawei.HuaweiSingleBattery,
    Toshiba.ToshibaSingleBatteryBAT0,
    Toshiba.ToshibaSingleBatteryBAT1,
    System76.System76SingleBattery,
    Lenovo.LenovoSingleBattery,
    ThinkpadLegacy.ThinkpadLegacyDualBattery,
    ThinkpadLegacy.ThinkpadLegacySingleBatteryBAT0,
    ThinkpadLegacy.ThinkpadLegacySingleBatteryBAT1,
    Apple.AppleSingleBattery,
    Acer.AcerSingleBattery,
    Msi.MsiSingleBatteryBAT0,
    Thinkpad.ThinkpadDualBattery,
    Thinkpad.ThinkpadSingleBatteryBAT0,
    Thinkpad.ThinkpadSingleBatteryBAT1,
    Dell.DellSmBiosSingleBattery,
    Panasonic.PanasonicSingleBattery,
    QC71.QC71SingleBatteryBAT0,
    Asahi.AsahiSingleBattery62,
    Msi.MsiSingleBatteryBAT1,
    Tuxedo.Tuxedo3ModesSingleBattery,
    Gigabyte.GigabyteSingleBattery,
    Asahi.AsahiSingleBattery63,
    Razer.RazerSingleBattery,
    Framework.FrameworkSingleBatteryBAT1,
    Librem.LibremSingleBatteryBAT0,
    Fujitsu.FujitsuSingleBatteryCMB0,
    Fujitsu.FujitsuSingleBatteryCMB1,
    Chromebook.ChromebookSingleBattery,
    Framework.FrameworkSingleBatteryEndStartBAT1,
    Chromebook.ChromebookSingleBatteryV2,
    GalaxyBook.GalaxyBookSingleBatteryBAT1,
    Acer2.Acer2SingleBattery,
    AcerNitro.AcerNitroSingleBattery,
    AcerPredator.AcerPredatorSingleBattery,
    Apple2.Apple2Bat0,
];
