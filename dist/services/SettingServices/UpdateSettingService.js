"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../../errors/AppError"));
const Setting_1 = __importDefault(require("../../models/Setting"));
const UpdateSettingService = async ({ key, value, companyId }) => {
    const [setting] = await Setting_1.default.findOrCreate({
        where: {
            key,
            companyId
        },
        defaults: {
            key,
            value,
            companyId
        }
    });
    if (setting != null && setting?.companyId !== companyId) {
        throw new AppError_1.default("No es posible consultar registros de otra empresa");
    }
    if (!setting) {
        throw new AppError_1.default("ERR_NO_SETTING_FOUND", 404);
    }
    await setting.update({ value });
    return setting;
};
exports.default = UpdateSettingService;
