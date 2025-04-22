"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const Sentry = __importStar(require("@sentry/node"));
const CheckContactOpenTickets_1 = __importDefault(require("../../helpers/CheckContactOpenTickets"));
const SetTicketMessagesAsRead_1 = __importDefault(require("../../helpers/SetTicketMessagesAsRead"));
const socket_1 = require("../../libs/socket");
const Setting_1 = __importDefault(require("../../models/Setting"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const ShowTicketService_1 = __importDefault(require("./ShowTicketService"));
const ShowWhatsAppService_1 = __importDefault(require("../WhatsappService/ShowWhatsAppService"));
const SendWhatsAppMessage_1 = __importDefault(require("../WbotServices/SendWhatsAppMessage"));
const FindOrCreateATicketTrakingService_1 = __importDefault(require("./FindOrCreateATicketTrakingService"));
const GetTicketWbot_1 = __importDefault(require("../../helpers/GetTicketWbot"));
const wbotMessageListener_1 = require("../WbotServices/wbotMessageListener");
const ListSettingsServiceOne_1 = __importDefault(require("../SettingServices/ListSettingsServiceOne")); //NOVO PLW DESIGN//
const ShowUserService_1 = __importDefault(require("../UserServices/ShowUserService")); //NOVO PLW DESIGN//
const lodash_1 = require("lodash");
const UpdateTicketService = async ({ ticketData, ticketId, companyId }) => {
    try {
        const { status } = ticketData;
        let { queueId, userId } = ticketData;
        let chatbot = ticketData.chatbot || false;
        let queueOptionId = ticketData.queueOptionId || null;
        const io = (0, socket_1.getIO)();
        const key = "userRating";
        const setting = await Setting_1.default.findOne({
            where: {
                companyId,
                key
            }
        });
        const ticket = await (0, ShowTicketService_1.default)(ticketId, companyId);
        const ticketTraking = await (0, FindOrCreateATicketTrakingService_1.default)({
            ticketId,
            companyId,
            whatsappId: ticket.whatsappId
        });
        await (0, SetTicketMessagesAsRead_1.default)(ticket);
        const oldStatus = ticket.status;
        const oldUserId = ticket.user?.id;
        const oldQueueId = ticket.queueId;
        if (oldStatus === "closed") {
            await (0, CheckContactOpenTickets_1.default)(ticket.contact.id);
            chatbot = null;
            queueOptionId = null;
        }
        if (status !== undefined && ["closed"].indexOf(status) > -1) {
            const { complationMessage, ratingMessage } = await (0, ShowWhatsAppService_1.default)(ticket.whatsappId, companyId);
            if (setting?.value === "enabled") {
                if (ticketTraking.ratingAt == null) {
                    const ratingTxt = ratingMessage || "";
                    let bodyRatingMessage = `\u200e${ratingTxt}\n\n`;
                    bodyRatingMessage +=
                        "Ingrese del 1 al 3 para calificar nuestro servicio:\n*1* - _Insatisfecho_\n*2* - _Satisfecho_\n*3* - _Muito Satisfeito_\n\n";
                    await (0, SendWhatsAppMessage_1.default)({ body: bodyRatingMessage, ticket });
                    await ticketTraking.update({
                        ratingAt: (0, moment_1.default)().toDate()
                    });
                    io.to("open")
                        .to(ticketId.toString())
                        .emit(`company-${ticket.companyId}-ticket`, {
                        action: "delete",
                        ticketId: ticket.id
                    });
                    return { ticket, oldStatus, oldUserId };
                }
                ticketTraking.ratingAt = (0, moment_1.default)().toDate();
                ticketTraking.rated = false;
            }
            if (!(0, lodash_1.isNil)(complationMessage) && complationMessage !== "") {
                const body = `\u200e${complationMessage}`;
                await (0, SendWhatsAppMessage_1.default)({ body, ticket });
            }
            ticketTraking.finishedAt = (0, moment_1.default)().toDate();
            ticketTraking.whatsappId = ticket.whatsappId;
            ticketTraking.userId = ticket.userId;
            /*    queueId = null;
                  userId = null; */
        }
        if (queueId !== undefined && queueId !== null) {
            ticketTraking.queuedAt = (0, moment_1.default)().toDate();
        }
        const settingsTransfTicket = await (0, ListSettingsServiceOne_1.default)({ companyId: companyId, key: "sendMsgTransfTicket" });
        if (settingsTransfTicket?.value === "enabled") {
            // Mensagem de transferencia da FILA
            if (oldQueueId !== queueId && oldUserId === userId && !(0, lodash_1.isNil)(oldQueueId) && !(0, lodash_1.isNil)(queueId)) {
                const queue = await Queue_1.default.findByPk(queueId);
                const wbot = await (0, GetTicketWbot_1.default)(ticket);
                const msgtxt = "*Mensaje automático*:\nHas sido transferido al departamento. *" + queue?.name + "*\nEspera, ¡nos comunicaremos contigo!";
                const queueChangedMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: msgtxt
                });
                await (0, wbotMessageListener_1.verifyMessage)(queueChangedMessage, ticket, ticket.contact);
            }
            else 
            // Mensagem de transferencia do ATENDENTE
            if (oldUserId !== userId && oldQueueId === queueId && !(0, lodash_1.isNil)(oldUserId) && !(0, lodash_1.isNil)(userId)) {
                const wbot = await (0, GetTicketWbot_1.default)(ticket);
                const nome = await (0, ShowUserService_1.default)(ticketData.userId);
                const msgtxt = "*Mensaje automático*:\nFue transferido al encargado. *" + nome.name + "*\nEspera, ¡nos comunicaremos contigo!";
                const queueChangedMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: msgtxt
                });
                await (0, wbotMessageListener_1.verifyMessage)(queueChangedMessage, ticket, ticket.contact);
            }
            else 
            // Mensagem de transferencia do ATENDENTE e da FILA
            if (oldUserId !== userId && !(0, lodash_1.isNil)(oldUserId) && !(0, lodash_1.isNil)(userId) && oldQueueId !== queueId && !(0, lodash_1.isNil)(oldQueueId) && !(0, lodash_1.isNil)(queueId)) {
                const wbot = await (0, GetTicketWbot_1.default)(ticket);
                const queue = await Queue_1.default.findByPk(queueId);
                const nome = await (0, ShowUserService_1.default)(ticketData.userId);
                const msgtxt = "*Mensaje automático*:\nHas sido transferido al departamento. *" + queue?.name + "* y será atendido por *" + nome.name + "*\nEspera, ¡nos comunicaremos contigo!";
                const queueChangedMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: msgtxt
                });
                await (0, wbotMessageListener_1.verifyMessage)(queueChangedMessage, ticket, ticket.contact);
            }
            else if (oldUserId !== undefined && (0, lodash_1.isNil)(userId) && oldQueueId !== queueId && !(0, lodash_1.isNil)(queueId)) {
                const queue = await Queue_1.default.findByPk(queueId);
                const wbot = await (0, GetTicketWbot_1.default)(ticket);
                const msgtxt = "*Mensaje automático*:\nHas sido transferido al departamento *" + queue?.name + "*\nEspera, ¡nos comunicaremos contigo!";
                const queueChangedMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                    text: msgtxt
                });
                await (0, wbotMessageListener_1.verifyMessage)(queueChangedMessage, ticket, ticket.contact);
            }
        }
        await ticket.update({
            status,
            queueId,
            userId,
            whatsappId: ticket.whatsappId,
            chatbot,
            queueOptionId
        });
        await ticket.reload();
        if (status !== undefined && ["pending"].indexOf(status) > -1) {
            ticketTraking.update({
                whatsappId: ticket.whatsappId,
                queuedAt: (0, moment_1.default)().toDate(),
                startedAt: null,
                userId: null
            });
        }
        if (status !== undefined && ["open"].indexOf(status) > -1) {
            ticketTraking.update({
                startedAt: (0, moment_1.default)().toDate(),
                ratingAt: null,
                rated: false,
                whatsappId: ticket.whatsappId,
                userId: ticket.userId
            });
        }
        await ticketTraking.save();
        if (ticket.status !== oldStatus || ticket.user?.id !== oldUserId) {
            io.to(oldStatus).emit(`company-${companyId}-ticket`, {
                action: "delete",
                ticketId: ticket.id
            });
        }
        io.to(ticket.status)
            .to("notification")
            .to(ticketId.toString())
            .emit(`company-${companyId}-ticket`, {
            action: "update",
            ticket
        });
        return { ticket, oldStatus, oldUserId };
    }
    catch (err) {
        Sentry.captureException(err);
    }
};
exports.default = UpdateTicketService;
