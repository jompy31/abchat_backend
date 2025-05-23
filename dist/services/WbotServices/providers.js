"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provider = void 0;
const Setting_1 = __importDefault(require("../../models/Setting"));
const wbotMessageListener_1 = require("./wbotMessageListener");
const Mustache_1 = __importDefault(require("../../helpers/Mustache"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const axios_1 = __importDefault(require("axios"));
const UpdateTicketService_1 = __importDefault(require("../TicketServices/UpdateTicketService"));
const fs_1 = __importDefault(require("fs"));
const provider = async (ticket, msg, companyId, contact, wbot) => {
    const filaescolhida = ticket.queue?.name;
    if (filaescolhida === "2ª Via de Boleto" || filaescolhida === "2 Via de Boleto") {
        let cpfcnpj;
        cpfcnpj = (0, wbotMessageListener_1.getBodyMessage)(msg);
        cpfcnpj = cpfcnpj.replace(/\./g, '');
        cpfcnpj = cpfcnpj.replace('-', '');
        cpfcnpj = cpfcnpj.replace('/', '');
        cpfcnpj = cpfcnpj.replace(' ', '');
        cpfcnpj = cpfcnpj.replace(',', '');
        const asaastoken = await Setting_1.default.findOne({
            where: {
                key: "asaas",
                companyId
            }
        });
        const ixcapikey = await Setting_1.default.findOne({
            where: {
                key: "tokenixc",
                companyId
            }
        });
        const urlixcdb = await Setting_1.default.findOne({
            where: {
                key: "ipixc",
                companyId
            }
        });
        const ipmkauth = await Setting_1.default.findOne({
            where: {
                key: "ipmkauth",
                companyId
            }
        });
        const clientidmkauth = await Setting_1.default.findOne({
            where: {
                key: "clientidmkauth",
                companyId
            }
        });
        const clientesecretmkauth = await Setting_1.default.findOne({
            where: {
                key: "clientsecretmkauth",
                companyId
            }
        });
        let urlmkauth = ipmkauth.value;
        if (urlmkauth.substr(-1) === '/') {
            urlmkauth = urlmkauth.slice(0, -1);
        }
        //VARS
        let url = `${urlmkauth}/api/`;
        const Client_Id = clientidmkauth.value;
        const Client_Secret = clientesecretmkauth.value;
        const ixckeybase64 = btoa(ixcapikey.value);
        const urlixc = urlixcdb.value;
        const asaastk = asaastoken.value;
        const cnpj_cpf = (0, wbotMessageListener_1.getBodyMessage)(msg);
        let numberCPFCNPJ = cpfcnpj;
        if (urlmkauth != "" && Client_Id != "" && Client_Secret != "") {
            if ((0, wbotMessageListener_1.isNumeric)(numberCPFCNPJ) === true) {
                if (cpfcnpj.length > 2) {
                    const isCPFCNPJ = (0, wbotMessageListener_1.validaCpfCnpj)(numberCPFCNPJ);
                    if (isCPFCNPJ) {
                        const textMessage = {
                            text: (0, Mustache_1.default)(`Aguarde! Estamos consultando la base de datos!`, contact),
                        };
                        try {
                            await (0, wbotMessageListener_1.sleep)(2000);
                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, textMessage);
                        }
                        catch (error) {
                        }
                        (0, axios_1.default)({
                            rejectUnauthorized: true,
                            method: 'get',
                            url,
                            auth: {
                                username: Client_Id,
                                password: Client_Secret
                            }
                        })
                            .then(function (response) {
                            const jtw = response.data;
                            var config = {
                                method: 'GET',
                                url: `${urlmkauth}/api/cliente/show/${numberCPFCNPJ}`,
                                headers: {
                                    Authorization: `Bearer ${jtw}`
                                }
                            };
                            axios_1.default.request(config)
                                .then(async function (response) {
                                if (response.data == 'NULL') {
                                    const textMessage = {
                                        text: (0, Mustache_1.default)(`¡Registro no encontrado! *CPF/CNPJ* incorrecto o no válido. ¡Intentar otra vez!`, contact),
                                    };
                                    try {
                                        await (0, wbotMessageListener_1.sleep)(2000);
                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, textMessage);
                                    }
                                    catch (error) {
                                        console.log('¡No pude enviar el mensaje!');
                                    }
                                }
                                else {
                                    let nome;
                                    let cpf_cnpj;
                                    let qrcode;
                                    let valor;
                                    let bloqueado;
                                    let linhadig;
                                    let uuid_cliente;
                                    let referencia;
                                    let status;
                                    let datavenc;
                                    let descricao;
                                    let titulo;
                                    let statusCorrigido;
                                    let valorCorrigido;
                                    nome = response.data.dados_cliente.titulos.nome;
                                    cpf_cnpj = response.data.dados_cliente.titulos.cpf_cnpj;
                                    valor = response.data.dados_cliente.titulos.valor;
                                    bloqueado = response.data.dados_cliente.titulos.bloqueado;
                                    uuid_cliente = response.data.dados_cliente.titulos.uuid_cliente;
                                    qrcode = response.data.dados_cliente.titulos.qrcode;
                                    linhadig = response.data.dados_cliente.titulos.linhadig;
                                    referencia = response.data.dados_cliente.titulos.referencia;
                                    status = response.data.dados_cliente.titulos.status;
                                    datavenc = response.data.dados_cliente.titulos.datavenc;
                                    descricao = response.data.dados_cliente.titulos.descricao;
                                    titulo = response.data.dados_cliente.titulos.titulo;
                                    statusCorrigido = status[0].toUpperCase() + status.substr(1);
                                    valorCorrigido = valor.replace(".", ",");
                                    var curdate = new Date(datavenc);
                                    const mesCorreto = curdate.getMonth() + 1;
                                    const ano = ('0' + curdate.getFullYear()).slice(-4);
                                    const mes = ('0' + mesCorreto).slice(-2);
                                    const dia = ('0' + curdate.getDate()).slice(-2);
                                    const anoMesDia = `${dia}/${mes}/${ano}`;
                                    try {
                                        const textMessage = { text: (0, Mustache_1.default)(`¡Encontré tu registro! *${nome}* ¡Solo un momento más por favor!`, contact) };
                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, textMessage);
                                        const bodyBoleto = { text: (0, Mustache_1.default)(`¡Sigue el duplicado de tu Factura!\n\n*Nombre:* ${nome}\n*Valor:* ₡ ${valorCorrigido}\n*Data Vencimento:* ${anoMesDia}\n*Link:* ${urlmkauth}/boleto/21boleto.php?titulo=${titulo}\n\nVou mandar o *código de barras* na próxima mensagem para ficar mais fácil para você copiar!`, contact) };
                                        await (0, wbotMessageListener_1.sleep)(2000);
                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyBoleto);
                                        const bodyLinha = { text: (0, Mustache_1.default)(`${linhadig}`, contact) };
                                        await (0, wbotMessageListener_1.sleep)(2000);
                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyLinha);
                                        if (qrcode !== null) {
                                            const bodyPdf = { text: (0, Mustache_1.default)(`Este es la *PIX COPIAR Y PEGAR*`, contact) };
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPdf);
                                            const bodyqrcode = { text: (0, Mustache_1.default)(`${qrcode}`, contact) };
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyqrcode);
                                            let linkBoleto = `https://chart.googleapis.com/chart?cht=qr&chs=500x500&chld=L|0&chl=${qrcode}`;
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await (0, wbotMessageListener_1.sendMessageImage)(wbot, contact, ticket, linkBoleto, "");
                                        }
                                        const bodyPdf = { text: (0, Mustache_1.default)(`Ahora te enviaré la factura en *PDF* si la necesitas.`, contact) };
                                        await (0, wbotMessageListener_1.sleep)(2000);
                                        const bodyPdfQr = { text: (0, Mustache_1.default)(`${bodyPdf}`, contact) };
                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPdfQr);
                                        await (0, wbotMessageListener_1.sleep)(2000);
                                        //GERA O PDF
                                        const nomePDF = `Boleto-${nome}-${dia}-${mes}-${ano}.pdf`;
                                        (async () => {
                                            const browser = await puppeteer_1.default.launch({ args: ['--no-sandbox'] });
                                            const page = await browser.newPage();
                                            const website_url = `${urlmkauth}/boleto/21boleto.php?titulo=${titulo}`;
                                            await page.goto(website_url, { waitUntil: 'networkidle0' });
                                            await page.emulateMediaType('screen');
                                            // Downlaod the PDF
                                            const pdf = await page.pdf({
                                                path: nomePDF,
                                                printBackground: true,
                                                format: 'A4',
                                            });
                                            await browser.close();
                                            await (0, wbotMessageListener_1.sendMessageLink)(wbot, contact, ticket, nomePDF, nomePDF);
                                        });
                                        if (bloqueado === 'sim') {
                                            const bodyBloqueio = { text: (0, Mustache_1.default)(`${nome} ¡También vi que tu conexión está bloqueada! Lo desbloquearé para ti *48 horas*.`, contact) };
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyBloqueio);
                                            const bodyqrcode = { text: (0, Mustache_1.default)(`Estoy concediendo su acceso. ¡Espere por favor!`, contact) };
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyqrcode);
                                            var optionsdesbloq = {
                                                method: 'GET',
                                                url: `${urlmkauth}/api/cliente/desbloqueio/${uuid_cliente}`,
                                                headers: {
                                                    Authorization: `Bearer ${jtw}`
                                                }
                                            };
                                            axios_1.default.request(optionsdesbloq).then(async function (response) {
                                                const bodyLiberado = { text: (0, Mustache_1.default)(`¡Lo lanzaré pronto! Voy a necesitar que *desconectes* tu equipo.\n\n*OBS: Retírelo únicamente del zócalo.* \nAguarde 1 minuto e ligue novamente!`, contact) };
                                                await (0, wbotMessageListener_1.sleep)(2000);
                                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyLiberado);
                                                const bodyqrcode = { text: (0, Mustache_1.default)(`¡Comprueba si tu acceso ha vuelto! Si no has regresado, ¡vuelve a ponerte en contacto y habla con un asistente!`, contact) };
                                                await (0, wbotMessageListener_1.sleep)(2000);
                                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyqrcode);
                                            }).catch(async function (error) {
                                                const bodyfinaliza = { text: (0, Mustache_1.default)(`¡Ups! ¡Algo malo pasó! Escriba *#* para volver al menú anterior y hablar con un asistente.`, contact) };
                                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                            });
                                        }
                                        const bodyfinaliza = { text: (0, Mustache_1.default)(`¡Estamos terminando esta conversación! Si lo necesitas ¡contáctanos!`, contact) };
                                        await (0, wbotMessageListener_1.sleep)(12000);
                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                        await (0, wbotMessageListener_1.sleep)(2000);
                                        fs_1.default.unlink(nomePDF, function (err) {
                                            if (err)
                                                throw err;
                                            console.log(err);
                                        });
                                        await (0, UpdateTicketService_1.default)({
                                            ticketData: { status: "closed" },
                                            ticketId: ticket.id,
                                            companyId: ticket.companyId,
                                        });
                                    }
                                    catch (error) {
                                        console.log('11 Não consegui enviar a mensagem!');
                                    }
                                }
                            })
                                .catch(async function (error) {
                                try {
                                    const bodyBoleto = { text: (0, Mustache_1.default)(`No pude encontrar su registro.\n\n¡Inténtelo de nuevo!\nO escriba *#* para regresar al *Menú anterior*`, contact) };
                                    await (0, wbotMessageListener_1.sleep)(2000);
                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyBoleto);
                                }
                                catch (error) {
                                    console.log('111 ¡No pude enviar el mensaje!');
                                }
                            });
                        })
                            .catch(async function (error) {
                            const bodyfinaliza = { text: (0, Mustache_1.default)(`¡Ups! ¡Algo malo pasó! Escriba *#* para volver al menú anterior y hablar con un asistente.`, contact) };
                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                        });
                    }
                    else {
                        const body = { text: (0, Mustache_1.default)(`Este CPF/CNPJ no es válido!\n\n¡Inténtelo de nuevo!\nO escriba *#* para regresar a*Menu Anterior*`, contact) };
                        await (0, wbotMessageListener_1.sleep)(2000);
                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                    }
                }
            }
        }
        if (asaastoken.value !== "") {
            if ((0, wbotMessageListener_1.isNumeric)(numberCPFCNPJ) === true) {
                if (cpfcnpj.length > 2) {
                    const isCPFCNPJ = (0, wbotMessageListener_1.validaCpfCnpj)(numberCPFCNPJ);
                    if (isCPFCNPJ) {
                        const body = {
                            text: (0, Mustache_1.default)(`Aguarde! ¡Estamos consultando la base de datos!`, contact),
                        };
                        try {
                            await (0, wbotMessageListener_1.sleep)(2000);
                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                        }
                        catch (error) {
                        }
                        var optionsc = {
                            method: 'GET',
                            url: 'https://www.asaas.com/api/v3/customers',
                            params: { cpfCnpj: numberCPFCNPJ },
                            headers: {
                                'Content-Type': 'application/json',
                                access_token: asaastk
                            }
                        };
                        axios_1.default.request(optionsc).then(async function (response) {
                            let nome;
                            let id_cliente;
                            let totalCount;
                            nome = response?.data?.data[0]?.name;
                            id_cliente = response?.data?.data[0]?.id;
                            totalCount = response?.data?.totalCount;
                            if (totalCount === 0) {
                                const body = {
                                    text: (0, Mustache_1.default)(`¡Registro no encontrado! *CPF/CNPJ incorrecto o no válido*. ¡Intentar otra vez!`, contact),
                                };
                                await (0, wbotMessageListener_1.sleep)(2000);
                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                            }
                            else {
                                const body = {
                                    text: (0, Mustache_1.default)(`Localizei seu Cadastro! \n*${nome}* só mais um instante por favor!`, contact),
                                };
                                await (0, wbotMessageListener_1.sleep)(2000);
                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                                var optionsListpaymentOVERDUE = {
                                    method: 'GET',
                                    url: 'https://www.asaas.com/api/v3/payments',
                                    params: { customer: id_cliente, status: 'OVERDUE' },
                                    headers: {
                                        'Content-Type': 'application/json',
                                        access_token: asaastk
                                    }
                                };
                                axios_1.default.request(optionsListpaymentOVERDUE).then(async function (response) {
                                    let totalCount_overdue;
                                    totalCount_overdue = response?.data?.totalCount;
                                    if (totalCount_overdue === 0) {
                                        const body = {
                                            text: (0, Mustache_1.default)(`¡No tienes facturas vencidas! \nLe enviaré la próxima factura. ¡Espere por favor!`, contact),
                                        };
                                        await (0, wbotMessageListener_1.sleep)(2000);
                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                                        var optionsPENDING = {
                                            method: 'GET',
                                            url: 'https://www.asaas.com/api/v3/payments',
                                            params: { customer: id_cliente, status: 'PENDING' },
                                            headers: {
                                                'Content-Type': 'application/json',
                                                access_token: asaastk
                                            }
                                        };
                                        axios_1.default.request(optionsPENDING).then(async function (response) {
                                            function sortfunction(a, b) {
                                                return a.dueDate.localeCompare(b.dueDate);
                                            }
                                            const ordenado = response?.data?.data.sort(sortfunction);
                                            let id_payment_pending;
                                            let value_pending;
                                            let description_pending;
                                            let invoiceUrl_pending;
                                            let dueDate_pending;
                                            let invoiceNumber_pending;
                                            let totalCount_pending;
                                            let value_pending_corrigida;
                                            let dueDate_pending_corrigida;
                                            id_payment_pending = ordenado[0]?.id;
                                            value_pending = ordenado[0]?.value;
                                            description_pending = ordenado[0]?.description;
                                            invoiceUrl_pending = ordenado[0]?.invoiceUrl;
                                            dueDate_pending = ordenado[0]?.dueDate;
                                            invoiceNumber_pending = ordenado[0]?.invoiceNumber;
                                            totalCount_pending = response?.data?.totalCount;
                                            dueDate_pending_corrigida = dueDate_pending?.split('-')?.reverse()?.join('/');
                                            value_pending_corrigida = value_pending.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
                                            const bodyBoleto = {
                                                text: (0, Mustache_1.default)(`¡Sigue el duplicado de tu Factura!\n\n*Fatura:* ${invoiceNumber_pending}\n*Nombre:* ${nome}\n*Valor:* ₡ ${value_pending_corrigida}\n*Fecha de vencimiento:* ${dueDate_pending_corrigida}\n*Descripción:*\n${description_pending}\n*Link:* ${invoiceUrl_pending}`, contact),
                                            };
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyBoleto);
                                            //GET DADOS PIX
                                            var optionsGetPIX = {
                                                method: 'GET',
                                                url: `https://www.asaas.com/api/v3/payments/${id_payment_pending}/pixQrCode`,
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    access_token: asaastk
                                                }
                                            };
                                            axios_1.default.request(optionsGetPIX).then(async function (response) {
                                                let success;
                                                let payload;
                                                success = response?.data?.success;
                                                payload = response?.data?.payload;
                                                if (success === true) {
                                                    const bodyPixCP = {
                                                        text: (0, Mustache_1.default)(`Este es la *PIX Copia e Cola*`, contact),
                                                    };
                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPixCP);
                                                    const bodyPix = {
                                                        text: (0, Mustache_1.default)(`${payload}`, contact),
                                                    };
                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPix);
                                                    let linkBoleto = `https://chart.googleapis.com/chart?cht=qr&chs=500x500&chld=L|0&chl=${payload}`;
                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                    await (0, wbotMessageListener_1.sendMessageImage)(wbot, contact, ticket, linkBoleto, '');
                                                    var optionsBoletopend = {
                                                        method: 'GET',
                                                        url: `https://www.asaas.com/api/v3/payments/${id_payment_pending}/identificationField`,
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            access_token: asaastk
                                                        }
                                                    };
                                                    axios_1.default.request(optionsBoletopend).then(async function (response) {
                                                        let codigo_barras;
                                                        codigo_barras = response.data.identificationField;
                                                        const bodycodigoBarras = {
                                                            text: (0, Mustache_1.default)(`${codigo_barras}`, contact),
                                                        };
                                                        if (response.data?.errors?.code !== 'invalid_action') {
                                                            const bodycodigo = {
                                                                text: (0, Mustache_1.default)(`Este es el *Código de Barras*!`, contact),
                                                            };
                                                            await (0, wbotMessageListener_1.sleep)(2000);
                                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodycodigo);
                                                            await (0, wbotMessageListener_1.sleep)(2000);
                                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodycodigoBarras);
                                                            const bodyfinaliza = {
                                                                text: (0, Mustache_1.default)(`¡Estamos terminando esta conversación! Si lo necesitas ¡contáctanos!`, contact),
                                                            };
                                                            await (0, wbotMessageListener_1.sleep)(2000);
                                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                                            await (0, wbotMessageListener_1.sleep)(2000);
                                                            await (0, UpdateTicketService_1.default)({
                                                                ticketData: { status: "closed" },
                                                                ticketId: ticket.id,
                                                                companyId: ticket.companyId,
                                                            });
                                                        }
                                                        else {
                                                            const bodyfinaliza = {
                                                                text: (0, Mustache_1.default)(`¡Estamos terminando esta conversación! Si lo necesitas ¡contáctanos!`, contact),
                                                            };
                                                            await (0, wbotMessageListener_1.sleep)(2000);
                                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                                            await (0, UpdateTicketService_1.default)({
                                                                ticketData: { status: "closed" },
                                                                ticketId: ticket.id,
                                                                companyId: ticket.companyId,
                                                            });
                                                        }
                                                    }).catch(async function (error) {
                                                        const bodyfinaliza = {
                                                            text: (0, Mustache_1.default)(`Estamos finalizando esta conversa! Caso precise entre em contato conosco!`, contact),
                                                        };
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                                        await (0, UpdateTicketService_1.default)({
                                                            ticketData: { status: "closed" },
                                                            ticketId: ticket.id,
                                                            companyId: ticket.companyId,
                                                        });
                                                    });
                                                }
                                            }).catch(async function (error) {
                                                const body = {
                                                    text: (0, Mustache_1.default)(`*¡¡¡Ups!!!*\n¡Ocurrió un error! ¡Escriba *#* y hable con un *Asistente*!`, contact),
                                                };
                                                await (0, wbotMessageListener_1.sleep)(2000);
                                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                                            });
                                        }).catch(async function (error) {
                                            const body = {
                                                text: (0, Mustache_1.default)(`*¡¡¡Ups!!!*\n¡Ocurrió un error! ¡Escriba *#* y hable con un *Asistente*!`, contact),
                                            };
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                                        });
                                    }
                                    else {
                                        let id_payment_overdue;
                                        let value_overdue;
                                        let description_overdue;
                                        let invoiceUrl_overdue;
                                        let dueDate_overdue;
                                        let invoiceNumber_overdue;
                                        let value_overdue_corrigida;
                                        let dueDate_overdue_corrigida;
                                        id_payment_overdue = response?.data?.data[0]?.id;
                                        value_overdue = response?.data?.data[0]?.value;
                                        description_overdue = response?.data?.data[0]?.description;
                                        invoiceUrl_overdue = response?.data?.data[0]?.invoiceUrl;
                                        dueDate_overdue = response?.data?.data[0]?.dueDate;
                                        invoiceNumber_overdue = response?.data?.data[0]?.invoiceNumber;
                                        dueDate_overdue_corrigida = dueDate_overdue?.split('-')?.reverse()?.join('/');
                                        value_overdue_corrigida = value_overdue.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
                                        const body = {
                                            text: (0, Mustache_1.default)(`Usted tiene *${totalCount_overdue}* fatura(s) vencida(s)! \nTe enviaré. ¡Espere por favor!`, contact),
                                        };
                                        await (0, wbotMessageListener_1.sleep)(2000);
                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                                        const bodyBoleto = {
                                            text: (0, Mustache_1.default)(`¡Sigue el duplicado de tu Factura!\n\n*Fatura:* ${invoiceNumber_overdue}\n*Nombre:* ${nome}\n*Valor:* ₡ ${value_overdue_corrigida}\n*Fecha de vencimiento:* ${dueDate_overdue_corrigida}\n*Descripción:*\n${description_overdue}\n*Link:* ${invoiceUrl_overdue}`, contact),
                                        };
                                        await (0, wbotMessageListener_1.sleep)(2000);
                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyBoleto);
                                        //GET DADOS PIX
                                        var optionsGetPIX = {
                                            method: 'GET',
                                            url: `https://www.asaas.com/api/v3/payments/${id_payment_overdue}/pixQrCode`,
                                            headers: {
                                                'Content-Type': 'application/json',
                                                access_token: asaastk
                                            }
                                        };
                                        axios_1.default.request(optionsGetPIX).then(async function (response) {
                                            let success;
                                            let payload;
                                            success = response?.data?.success;
                                            payload = response?.data?.payload;
                                            if (success === true) {
                                                const bodyPixCP = {
                                                    text: (0, Mustache_1.default)(`Este es el *PIX Copiar y pegar*`, contact),
                                                };
                                                await (0, wbotMessageListener_1.sleep)(2000);
                                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPixCP);
                                                const bodyPix = {
                                                    text: (0, Mustache_1.default)(`${payload}`, contact),
                                                };
                                                await (0, wbotMessageListener_1.sleep)(2000);
                                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPix);
                                                let linkBoleto = `https://chart.googleapis.com/chart?cht=qr&chs=500x500&chld=L|0&chl=${payload}`;
                                                await (0, wbotMessageListener_1.sleep)(2000);
                                                await (0, wbotMessageListener_1.sendMessageImage)(wbot, contact, ticket, linkBoleto, '');
                                                var optionsBoleto = {
                                                    method: 'GET',
                                                    url: `https://www.asaas.com/api/v3/payments/${id_payment_overdue}/identificationField`,
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        access_token: asaastk
                                                    }
                                                };
                                                axios_1.default.request(optionsBoleto).then(async function (response) {
                                                    let codigo_barras;
                                                    codigo_barras = response.data.identificationField;
                                                    const bodycodigoBarras = {
                                                        text: (0, Mustache_1.default)(`${codigo_barras}`, contact),
                                                    };
                                                    if (response.data?.errors?.code !== 'invalid_action') {
                                                        const bodycodigo = {
                                                            text: (0, Mustache_1.default)(`Este es el *Código de Barras*!`, contact),
                                                        };
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodycodigo);
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodycodigoBarras);
                                                        const bodyfinaliza = {
                                                            text: (0, Mustache_1.default)(`¡Estamos terminando esta conversación! Si lo necesitas ¡contáctanos!`, contact),
                                                        };
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                                        await (0, UpdateTicketService_1.default)({
                                                            ticketData: { status: "closed" },
                                                            ticketId: ticket.id,
                                                            companyId: ticket.companyId,
                                                        });
                                                    }
                                                    else {
                                                        const bodyfinaliza = {
                                                            text: (0, Mustache_1.default)(`¡Estamos terminando esta conversación! Si lo necesitas ¡contáctanos!`, contact),
                                                        };
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                                        await (0, UpdateTicketService_1.default)({
                                                            ticketData: { status: "closed" },
                                                            ticketId: ticket.id,
                                                            companyId: ticket.companyId,
                                                        });
                                                    }
                                                }).catch(function (error) {
                                                    //console.error(error);
                                                });
                                            }
                                        }).catch(function (error) {
                                        });
                                    }
                                }).catch(async function (error) {
                                    const body = {
                                        text: (0, Mustache_1.default)(`*Opss!!!!*\nOcorreu um erro! Digite *#* e fale com um *Atendente*!`, contact),
                                    };
                                    await (0, wbotMessageListener_1.sleep)(2000);
                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                                });
                            }
                        }).catch(async function (error) {
                            const body = {
                                text: (0, Mustache_1.default)(`*Opss!!!!*\nOcorreu um erro! Digite *#* e fale com um *Atendente*!`, contact),
                            };
                            await (0, wbotMessageListener_1.sleep)(2000);
                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                        });
                    }
                }
            }
        }
        if (ixcapikey.value != "" && urlixcdb.value != "") {
            if ((0, wbotMessageListener_1.isNumeric)(numberCPFCNPJ) === true) {
                if (cpfcnpj.length > 2) {
                    const isCPFCNPJ = (0, wbotMessageListener_1.validaCpfCnpj)(numberCPFCNPJ);
                    if (isCPFCNPJ) {
                        if (numberCPFCNPJ.length <= 11) {
                            numberCPFCNPJ = numberCPFCNPJ.replace(/(\d{3})(\d)/, "$1.$2");
                            numberCPFCNPJ = numberCPFCNPJ.replace(/(\d{3})(\d)/, "$1.$2");
                            numberCPFCNPJ = numberCPFCNPJ.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                        }
                        else {
                            numberCPFCNPJ = numberCPFCNPJ.replace(/^(\d{2})(\d)/, "$1.$2");
                            numberCPFCNPJ = numberCPFCNPJ.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
                            numberCPFCNPJ = numberCPFCNPJ.replace(/\.(\d{3})(\d)/, ".$1/$2");
                            numberCPFCNPJ = numberCPFCNPJ.replace(/(\d{4})(\d)/, "$1-$2");
                        }
                        //const token = await CheckSettingsHelper("OBTEM O TOKEN DO BANCO (dei insert na tabela settings)")
                        const body = {
                            text: (0, Mustache_1.default)(`¡Esperar! ¡Estamos consultando la base de datos!`, contact),
                        };
                        try {
                            await (0, wbotMessageListener_1.sleep)(2000);
                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                        }
                        catch (error) {
                        }
                        var options = {
                            method: 'GET',
                            url: `${urlixc}/webservice/v1/cliente`,
                            headers: {
                                ixcsoft: 'listar',
                                Authorization: `Basic ${ixckeybase64}`
                            },
                            data: {
                                qtype: 'cliente.cnpj_cpf',
                                query: numberCPFCNPJ,
                                oper: '=',
                                page: '1',
                                rp: '1',
                                sortname: 'cliente.cnpj_cpf',
                                sortorder: 'asc'
                            }
                        };
                        axios_1.default.request(options).then(async function (response) {
                            if (response.data.type === 'error') {
                                console.log("Error response", response.data.message);
                                const body = {
                                    text: (0, Mustache_1.default)(`*¡¡¡Ups!!!*\n¡Ocurrió un error! ¡Escriba *#* y hable con un *Asistente*!`, contact),
                                };
                                await (0, wbotMessageListener_1.sleep)(2000);
                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                            }
                            if (response.data.total === 0) {
                                const body = {
                                    text: (0, Mustache_1.default)(`¡Registro no encontrado! *CPF/CNPJ incorrecto o no válido*. ¡Intentar otra vez!`, contact),
                                };
                                try {
                                    await (0, wbotMessageListener_1.sleep)(2000);
                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                                }
                                catch (error) {
                                }
                            }
                            else {
                                let nome;
                                let id;
                                let type;
                                nome = response.data?.registros[0]?.razao;
                                id = response.data?.registros[0]?.id;
                                type = response.data?.type;
                                const body = {
                                    text: (0, Mustache_1.default)(`¡Encontré tu registro! \n*${nome}* ¡Solo un momento más por favor!`, contact),
                                };
                                await (0, wbotMessageListener_1.sleep)(2000);
                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                                var boleto = {
                                    method: 'GET',
                                    url: `${urlixc}/webservice/v1/fn_areceber`,
                                    headers: {
                                        ixcsoft: 'listar',
                                        Authorization: `Basic ${ixckeybase64}`
                                    },
                                    data: {
                                        qtype: 'fn_areceber.id_cliente',
                                        query: id,
                                        oper: '=',
                                        page: '1',
                                        rp: '1',
                                        sortname: 'fn_areceber.data_vencimento',
                                        sortorder: 'asc',
                                        grid_param: '[{"TB":"fn_areceber.status", "OP" : "=", "P" : "A"}]'
                                    }
                                };
                                axios_1.default.request(boleto).then(async function (response) {
                                    let gateway_link;
                                    let valor;
                                    let datavenc;
                                    let datavencCorrigida;
                                    let valorCorrigido;
                                    let linha_digitavel;
                                    let impresso;
                                    let idboleto;
                                    idboleto = response.data?.registros[0]?.id;
                                    gateway_link = response.data?.registros[0]?.gateway_link;
                                    valor = response.data?.registros[0]?.valor;
                                    datavenc = response.data?.registros[0]?.data_vencimento;
                                    linha_digitavel = response.data?.registros[0]?.linha_digitavel;
                                    impresso = response.data?.registros[0]?.impresso;
                                    valorCorrigido = valor.replace(".", ",");
                                    datavencCorrigida = datavenc.split('-').reverse().join('/');
                                    //INFORMAÇÕES BOLETO
                                    const bodyBoleto = {
                                        text: (0, Mustache_1.default)(`¡Sigue el duplicado de tu Factura!\n\n*Fatura:* ${idboleto}\n*Nombre:* ${nome}\n*Valor:* ₡ ${valorCorrigido}\n*Fecha de vencimiento:* ${datavencCorrigida}\n\n¡Te enviaré el *código de barras* en el siguiente mensaje para que te resulte más fácil copiarlo!`, contact),
                                    };
                                    //await sleep(2000)
                                    //await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyBoleto);
                                    //LINHA DIGITAVEL
                                    if (impresso !== "S") {
                                        //IMPRIME BOLETO PARA GERAR CODIGO BARRAS
                                        var boletopdf = {
                                            method: 'GET',
                                            url: `${urlixc}/webservice/v1/get_boleto`,
                                            headers: {
                                                ixcsoft: 'listar',
                                                Authorization: `Basic ${ixckeybase64}`
                                            },
                                            data: {
                                                boletos: idboleto,
                                                juro: 'N',
                                                multa: 'N',
                                                atualiza_boleto: 'N',
                                                tipo_boleto: 'arquivo',
                                                base64: 'S'
                                            }
                                        };
                                        axios_1.default.request(boletopdf).then(function (response) {
                                        }).catch(function (error) {
                                            console.error(error);
                                        });
                                    }
                                    //SE TIVER PIX ENVIA O PIX
                                    var optionsPix = {
                                        method: 'GET',
                                        url: `${urlixc}/webservice/v1/get_pix`,
                                        headers: {
                                            ixcsoft: 'listar',
                                            Authorization: `Basic ${ixckeybase64}`
                                        },
                                        data: { id_areceber: idboleto }
                                    };
                                    axios_1.default.request(optionsPix).then(async function (response) {
                                        let tipo;
                                        let pix;
                                        tipo = response.data?.type;
                                        pix = response.data?.pix?.qrCode?.qrcode;
                                        if (tipo === 'success') {
                                            const bodyBoletoPix = {
                                                text: (0, Mustache_1.default)(`¡Sigue el duplicado de tu Factura!\n\n*Fatura:* ${idboleto}\n*Nombre:* ${nome}\n*Valor:* ₡ ${valorCorrigido}\n*Fecha de vencimiento:* ${datavencCorrigida}\n\nTe enviaré el *Código de Barras* y la *PIX* ¡simplemente haz clic en cuál quieres usar y se copiará! Entonces simplemente haz el pago en tu banco.`, contact),
                                            };
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyBoletoPix);
                                            const body_linhadigitavel = {
                                                text: (0, Mustache_1.default)("Este es el *Código de Barras*", contact),
                                            };
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body_linhadigitavel);
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            const body_linha_digitavel = {
                                                text: (0, Mustache_1.default)(`${linha_digitavel}`, contact),
                                            };
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body_linha_digitavel);
                                            const body_pix = {
                                                text: (0, Mustache_1.default)("Este es el *PIX Copiar y Pegar*", contact),
                                            };
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body_pix);
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            const body_pix_dig = {
                                                text: (0, Mustache_1.default)(`${pix}`, contact),
                                            };
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body_pix_dig);
                                            const body_pixqr = {
                                                text: (0, Mustache_1.default)("QR CODE do *PIX*", contact),
                                            };
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body_pixqr);
                                            let linkBoleto = `https://chart.googleapis.com/chart?cht=qr&chs=500x500&chld=L|0&chl=${pix}`;
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await (0, wbotMessageListener_1.sendMessageImage)(wbot, contact, ticket, linkBoleto, '');
                                            ///VE SE ESTA BLOQUEADO PARA LIBERAR!
                                            var optionscontrato = {
                                                method: 'POST',
                                                url: `${urlixc}/webservice/v1/cliente_contrato`,
                                                headers: {
                                                    ixcsoft: 'listar',
                                                    Authorization: `Basic ${ixckeybase64}`
                                                },
                                                data: {
                                                    qtype: 'cliente_contrato.id_cliente',
                                                    query: id,
                                                    oper: '=',
                                                    page: '1',
                                                    rp: '1',
                                                    sortname: 'cliente_contrato.id',
                                                    sortorder: 'asc'
                                                }
                                            };
                                            axios_1.default.request(optionscontrato).then(async function (response) {
                                                let status_internet;
                                                let id_contrato;
                                                status_internet = response.data?.registros[0]?.status_internet;
                                                id_contrato = response.data?.registros[0]?.id;
                                                if (status_internet !== 'A') {
                                                    const bodyPdf = {
                                                        text: (0, Mustache_1.default)(`*${nome}* ¡También vi que tu conexión está bloqueada! Lo desbloquearé por ti.`, contact),
                                                    };
                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPdf);
                                                    const bodyqrcode = {
                                                        text: (0, Mustache_1.default)(`Estoy concediendo su acceso. ¡Espere por favor!`, contact),
                                                    };
                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyqrcode);
                                                    //REALIZANDO O DESBLOQUEIO
                                                    var optionsdesbloqeuio = {
                                                        method: 'POST',
                                                        url: `${urlixc}/webservice/v1/desbloqueio_confianca`,
                                                        headers: {
                                                            Authorization: `Basic ${ixckeybase64}`
                                                        },
                                                        data: { id: id_contrato }
                                                    };
                                                    axios_1.default.request(optionsdesbloqeuio).then(async function (response) {
                                                        let tipo;
                                                        let mensagem;
                                                        tipo = response.data?.tipo;
                                                        mensagem = response.data?.mensagem;
                                                        if (tipo === 'sucesso') {
                                                            //DESCONECTANDO O CLIENTE PARA VOLTAR O ACESSO
                                                            var optionsRadius = {
                                                                method: 'GET',
                                                                url: `${urlixc}/webservice/v1/radusuarios`,
                                                                headers: {
                                                                    ixcsoft: 'listar',
                                                                    Authorization: `Basic ${ixckeybase64}`
                                                                },
                                                                data: {
                                                                    qtype: 'radusuarios.id_cliente',
                                                                    query: id,
                                                                    oper: '=',
                                                                    page: '1',
                                                                    rp: '1',
                                                                    sortname: 'radusuarios.id',
                                                                    sortorder: 'asc'
                                                                }
                                                            };
                                                            axios_1.default.request(optionsRadius).then(async function (response) {
                                                                let tipo;
                                                                tipo = response.data?.type;
                                                                if (tipo === 'success') {
                                                                    const body_mensagem = {
                                                                        text: (0, Mustache_1.default)(`${mensagem}`, contact),
                                                                    };
                                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body_mensagem);
                                                                    const bodyPdf = {
                                                                        text: (0, Mustache_1.default)(`¡Hice los trámites de liberación! ¡Ahora espere hasta 5 minutos y vea si su conexión regresa! .\n\nSi no has regresado, ¡vuelve a ponerte en contacto y habla con un asistente!`, contact),
                                                                    };
                                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPdf);
                                                                    const bodyfinaliza = {
                                                                        text: (0, Mustache_1.default)(`¡Estamos terminando esta conversación! Si lo necesitas ¡contáctanos!`, contact),
                                                                    };
                                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                                                    await (0, UpdateTicketService_1.default)({
                                                                        ticketData: { status: "closed" },
                                                                        ticketId: ticket.id,
                                                                        companyId: ticket.companyId,
                                                                    });
                                                                }
                                                            }).catch(function (error) {
                                                                console.error(error);
                                                            });
                                                            //FIM DA DESCONEXÃO
                                                        }
                                                        else {
                                                            var msgerrolbieracao = response.data.mensagem;
                                                            const bodyerro = {
                                                                text: (0, Mustache_1.default)(`¡Ups! Ocurrió un error y no pude desbloquear`, contact),
                                                            };
                                                            const msg_errolbieracao = {
                                                                text: (0, Mustache_1.default)(`${msgerrolbieracao}`, contact),
                                                            };
                                                            await (0, wbotMessageListener_1.sleep)(2000);
                                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyerro);
                                                            await (0, wbotMessageListener_1.sleep)(2000);
                                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, msg_errolbieracao);
                                                            const bodyerroatendent = {
                                                                text: (0, Mustache_1.default)(`¡Escriba *#* para regresar al menú y hablar con un asistente!`, contact),
                                                            };
                                                            await (0, wbotMessageListener_1.sleep)(2000);
                                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyerroatendent);
                                                        }
                                                    }).catch(async function (error) {
                                                        const bodyerro = {
                                                            text: (0, Mustache_1.default)(`¡Ups! Se produjo un error, escriba *#* y hable con un asistente.`, contact),
                                                        };
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyerro);
                                                    });
                                                }
                                                else {
                                                    const bodyfinaliza = {
                                                        text: (0, Mustache_1.default)(`¡Estamos terminando esta conversación! Si lo necesitas ¡contáctanos!`, contact),
                                                    };
                                                    await (0, wbotMessageListener_1.sleep)(8000);
                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                                    await (0, UpdateTicketService_1.default)({
                                                        ticketData: { status: "closed" },
                                                        ticketId: ticket.id,
                                                        companyId: ticket.companyId,
                                                    });
                                                }
                                                //
                                            }).catch(async function (error) {
                                                const bodyerro = {
                                                    text: (0, Mustache_1.default)(`¡Ups! Se produjo un error, escriba *#* y hable con un asistente.`, contact),
                                                };
                                                await (0, wbotMessageListener_1.sleep)(2000);
                                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyerro);
                                            });
                                            ///VE SE ESTA BLOQUEADO PARA LIBERAR!
                                        }
                                        else {
                                            const bodyBoleto = {
                                                text: (0, Mustache_1.default)(`¡Sigue el duplicado de tu Factura!\n\n*Factura:* ${idboleto}\n*Nombre:* ${nome}\n*Valor:* ₡ ${valorCorrigido}\n*Fecha de vencimiento:* ${datavencCorrigida}\n\nSimplemente haga clic en el código de barras a continuación para copiarlo y luego simplemente realice el pago en su banco.`, contact),
                                            };
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyBoleto);
                                            const body = {
                                                text: (0, Mustache_1.default)(`Este es el *Codigo de Barras*`, contact),
                                            };
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            const body_linha_digitavel = {
                                                text: (0, Mustache_1.default)(`${linha_digitavel}`, contact),
                                            };
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body_linha_digitavel);
                                            ///VE SE ESTA BLOQUEADO PARA LIBERAR!
                                            var optionscontrato = {
                                                method: 'POST',
                                                url: `${urlixc}/webservice/v1/cliente_contrato`,
                                                headers: {
                                                    ixcsoft: 'listar',
                                                    Authorization: `Basic ${ixckeybase64}`
                                                },
                                                data: {
                                                    qtype: 'cliente_contrato.id_cliente',
                                                    query: id,
                                                    oper: '=',
                                                    page: '1',
                                                    rp: '1',
                                                    sortname: 'cliente_contrato.id',
                                                    sortorder: 'asc'
                                                }
                                            };
                                            axios_1.default.request(optionscontrato).then(async function (response) {
                                                let status_internet;
                                                let id_contrato;
                                                status_internet = response.data?.registros[0]?.status_internet;
                                                id_contrato = response.data?.registros[0]?.id;
                                                if (status_internet !== 'A') {
                                                    const bodyPdf = {
                                                        text: (0, Mustache_1.default)(`*${nome}* ¡También vi que tu conexión está bloqueada! Lo desbloquearé por ti.`, contact),
                                                    };
                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPdf);
                                                    const bodyqrcode = {
                                                        text: (0, Mustache_1.default)(`Estoy concediendo su acceso. ¡Espere por favor!`, contact),
                                                    };
                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyqrcode);
                                                    //REALIZANDO O DESBLOQUEIO
                                                    var optionsdesbloqeuio = {
                                                        method: 'POST',
                                                        url: `${urlixc}/webservice/v1/desbloqueio_confianca`,
                                                        headers: {
                                                            Authorization: `Basic ${ixckeybase64}`
                                                        },
                                                        data: { id: id_contrato }
                                                    };
                                                    axios_1.default.request(optionsdesbloqeuio).then(async function (response) {
                                                        let tipo;
                                                        let mensagem;
                                                        tipo = response.data?.tipo;
                                                        mensagem = response.data?.mensagem;
                                                        if (tipo === 'sucesso') {
                                                            //DESCONECTANDO O CLIENTE PARA VOLTAR O ACESSO
                                                            var optionsRadius = {
                                                                method: 'GET',
                                                                url: `${urlixc}/webservice/v1/radusuarios`,
                                                                headers: {
                                                                    ixcsoft: 'listar',
                                                                    Authorization: `Basic ${ixckeybase64}`
                                                                },
                                                                data: {
                                                                    qtype: 'radusuarios.id_cliente',
                                                                    query: id,
                                                                    oper: '=',
                                                                    page: '1',
                                                                    rp: '1',
                                                                    sortname: 'radusuarios.id',
                                                                    sortorder: 'asc'
                                                                }
                                                            };
                                                            axios_1.default.request(optionsRadius).then(async function (response) {
                                                                let tipo;
                                                                tipo = response.data?.type;
                                                                const body_mensagem = {
                                                                    text: (0, Mustache_1.default)(`${mensagem}`, contact),
                                                                };
                                                                if (tipo === 'success') {
                                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body_mensagem);
                                                                    const bodyPdf = {
                                                                        text: (0, Mustache_1.default)(`¡Hice los trámites de liberación! ¡Ahora espere hasta 5 minutos y vea si su conexión regresa! .\n\nSi no has regresado, ¡vuelve a ponerte en contacto y habla con un asistente!`, contact),
                                                                    };
                                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPdf);
                                                                    const bodyfinaliza = {
                                                                        text: (0, Mustache_1.default)(`¡Estamos terminando esta conversación! Si lo necesitas ¡contáctanos!`, contact),
                                                                    };
                                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                                                    await (0, UpdateTicketService_1.default)({
                                                                        ticketData: { status: "closed" },
                                                                        ticketId: ticket.id,
                                                                        companyId: ticket.companyId,
                                                                    });
                                                                }
                                                                else {
                                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body_mensagem);
                                                                    const bodyPdf = {
                                                                        text: (0, Mustache_1.default)(`Necesitaré que *desconectes* tu equipo del enchufe.\n\n*NOTA: simplemente desconéctalo.* \n¡Espera 1 minuto y enciéndelo nuevamente!`, contact),
                                                                    };
                                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPdf);
                                                                    const bodyqrcode = {
                                                                        text: (0, Mustache_1.default)(`¡Comprueba si tu acceso ha vuelto! Si no has regresado, ¡vuelve a ponerte en contacto y habla con un asistente!`, contact),
                                                                    };
                                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyqrcode);
                                                                    const bodyfinaliza = {
                                                                        text: (0, Mustache_1.default)(`¡Estamos terminando esta conversación! Si lo necesitas ¡contáctanos!`, contact),
                                                                    };
                                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                                                    await (0, UpdateTicketService_1.default)({
                                                                        ticketData: { status: "closed" },
                                                                        ticketId: ticket.id,
                                                                        companyId: ticket.companyId,
                                                                    });
                                                                }
                                                            }).catch(function (error) {
                                                                console.error(error);
                                                            });
                                                            //FIM DA DESCONEXÃO
                                                        }
                                                        else {
                                                            const bodyerro = {
                                                                text: (0, Mustache_1.default)(`¡Ups! ¡Ocurrió un error y no pude desbloquearlo! Escriba *#* y hable con un asistente.`, contact),
                                                            };
                                                            await (0, wbotMessageListener_1.sleep)(2000);
                                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyerro);
                                                        }
                                                    }).catch(async function (error) {
                                                        const bodyerro = {
                                                            text: (0, Mustache_1.default)(`¡Ups! Se produjo un error, escriba *#* y hable con un asistente.`, contact),
                                                        };
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyerro);
                                                    });
                                                }
                                                else {
                                                    const bodyfinaliza = {
                                                        text: (0, Mustache_1.default)(`¡Estamos terminando esta conversación! Si lo necesitas ¡contáctanos!`, contact),
                                                    };
                                                    await (0, wbotMessageListener_1.sleep)(2000);
                                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                                    await (0, UpdateTicketService_1.default)({
                                                        ticketData: { status: "closed" },
                                                        ticketId: ticket.id,
                                                        companyId: ticket.companyId,
                                                    });
                                                }
                                                //
                                            }).catch(async function (error) {
                                                const bodyerro = {
                                                    text: (0, Mustache_1.default)(`¡Ups! Se produjo un error, escriba *#* y hable con un asistente.`, contact),
                                                };
                                                await (0, wbotMessageListener_1.sleep)(2000);
                                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyerro);
                                            });
                                            ///VE SE ESTA BLOQUEADO PARA LIBERAR!
                                        }
                                    }).catch(function (error) {
                                        console.error(error);
                                    });
                                    //FIM DO PÌX
                                }).catch(function (error) {
                                    console.error(error);
                                });
                            }
                        }).catch(async function (error) {
                            const body = {
                                text: (0, Mustache_1.default)(`*¡¡¡Ups!!!*\n¡Ocurrió un error! ¡Escriba *#* y hable con un *Asistente*!`, contact),
                            };
                            await (0, wbotMessageListener_1.sleep)(2000);
                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                        });
                    }
                    else {
                        const body = {
                            text: (0, Mustache_1.default)(`¡Este CPF/CNPJ no es válido!\n\n¡Inténtelo de nuevo!\nO escriba *#* para regresar al *Menú anterior*`, contact),
                        };
                        await (0, wbotMessageListener_1.sleep)(2000);
                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                    }
                }
            }
        }
    }
    if (filaescolhida === "Religue de Confiança" || filaescolhida === "Liberação em Confiança") {
        let cpfcnpj;
        cpfcnpj = (0, wbotMessageListener_1.getBodyMessage)(msg);
        cpfcnpj = cpfcnpj.replace(/\./g, '');
        cpfcnpj = cpfcnpj.replace('-', '');
        cpfcnpj = cpfcnpj.replace('/', '');
        cpfcnpj = cpfcnpj.replace(' ', '');
        cpfcnpj = cpfcnpj.replace(',', '');
        const asaastoken = await Setting_1.default.findOne({
            where: {
                key: "asaas",
                companyId
            }
        });
        const ixcapikey = await Setting_1.default.findOne({
            where: {
                key: "tokenixc",
                companyId
            }
        });
        const urlixcdb = await Setting_1.default.findOne({
            where: {
                key: "ipixc",
                companyId
            }
        });
        const ipmkauth = await Setting_1.default.findOne({
            where: {
                key: "ipmkauth",
                companyId
            }
        });
        const clientidmkauth = await Setting_1.default.findOne({
            where: {
                key: "clientidmkauth",
                companyId
            }
        });
        const clientesecretmkauth = await Setting_1.default.findOne({
            where: {
                key: "clientsecretmkauth",
                companyId
            }
        });
        let urlmkauth = ipmkauth.value;
        if (urlmkauth.substr(-1) === '/') {
            urlmkauth = urlmkauth.slice(0, -1);
        }
        //VARS
        let url = `${urlmkauth}/api/`;
        const Client_Id = clientidmkauth.value;
        const Client_Secret = clientesecretmkauth.value;
        const ixckeybase64 = btoa(ixcapikey.value);
        const urlixc = urlixcdb.value;
        const asaastk = asaastoken.value;
        const cnpj_cpf = (0, wbotMessageListener_1.getBodyMessage)(msg);
        let numberCPFCNPJ = cpfcnpj;
        if (ixcapikey.value != "" && urlixcdb.value != "") {
            if ((0, wbotMessageListener_1.isNumeric)(numberCPFCNPJ) === true) {
                if (cpfcnpj.length > 2) {
                    const isCPFCNPJ = (0, wbotMessageListener_1.validaCpfCnpj)(numberCPFCNPJ);
                    if (isCPFCNPJ) {
                        if (numberCPFCNPJ.length <= 11) {
                            numberCPFCNPJ = numberCPFCNPJ.replace(/(\d{3})(\d)/, "$1.$2");
                            numberCPFCNPJ = numberCPFCNPJ.replace(/(\d{3})(\d)/, "$1.$2");
                            numberCPFCNPJ = numberCPFCNPJ.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                        }
                        else {
                            numberCPFCNPJ = numberCPFCNPJ.replace(/^(\d{2})(\d)/, "$1.$2");
                            numberCPFCNPJ = numberCPFCNPJ.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
                            numberCPFCNPJ = numberCPFCNPJ.replace(/\.(\d{3})(\d)/, ".$1/$2");
                            numberCPFCNPJ = numberCPFCNPJ.replace(/(\d{4})(\d)/, "$1-$2");
                        }
                        //const token = await CheckSettingsHelper("OBTEM O TOKEN DO BANCO (dei insert na tabela settings)")
                        const body = {
                            text: (0, Mustache_1.default)(`Aguarde! Estamos consultando la base de datos!`, contact),
                        };
                        try {
                            await (0, wbotMessageListener_1.sleep)(2000);
                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                        }
                        catch (error) {
                        }
                        var options = {
                            method: 'GET',
                            url: `${urlixc}/webservice/v1/cliente`,
                            headers: {
                                ixcsoft: 'listar',
                                Authorization: `Basic ${ixckeybase64}`
                            },
                            data: {
                                qtype: 'cliente.cnpj_cpf',
                                query: numberCPFCNPJ,
                                oper: '=',
                                page: '1',
                                rp: '1',
                                sortname: 'cliente.cnpj_cpf',
                                sortorder: 'asc'
                            }
                        };
                        axios_1.default.request(options).then(async function (response) {
                            if (response.data.type === 'error') {
                                const body = {
                                    text: (0, Mustache_1.default)(`*¡¡¡Ups!!!*\¡Ocurrió un error! ¡Escriba *#* y hable con un *Asistente*!`, contact),
                                };
                                await (0, wbotMessageListener_1.sleep)(2000);
                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                            }
                            if (response.data.total === 0) {
                                const body = {
                                    text: (0, Mustache_1.default)(`¡Registro no encontrado! *CPF/CNPJ incorrecto o no válido*. ¡Intentar otra vez!`, contact),
                                };
                                try {
                                    await (0, wbotMessageListener_1.sleep)(2000);
                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                                }
                                catch (error) {
                                }
                            }
                            else {
                                let nome;
                                let id;
                                let type;
                                nome = response.data?.registros[0]?.razao;
                                id = response.data?.registros[0]?.id;
                                type = response.data?.type;
                                const body = {
                                    text: (0, Mustache_1.default)(`¡Encontré tu registro! \n*${nome}* ¡Solo un momento más por favor!`, contact),
                                };
                                await (0, wbotMessageListener_1.sleep)(2000);
                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                                ///VE SE ESTA BLOQUEADO PARA LIBERAR!
                                var optionscontrato = {
                                    method: 'POST',
                                    url: `${urlixc}/webservice/v1/cliente_contrato`,
                                    headers: {
                                        ixcsoft: 'listar',
                                        Authorization: `Basic ${ixckeybase64}`
                                    },
                                    data: {
                                        qtype: 'cliente_contrato.id_cliente',
                                        query: id,
                                        oper: '=',
                                        page: '1',
                                        rp: '1',
                                        sortname: 'cliente_contrato.id',
                                        sortorder: 'asc'
                                    }
                                };
                                axios_1.default.request(optionscontrato).then(async function (response) {
                                    let status_internet;
                                    let id_contrato;
                                    status_internet = response.data?.registros[0]?.status_internet;
                                    id_contrato = response.data?.registros[0]?.id;
                                    if (status_internet !== 'A') {
                                        const bodyPdf = {
                                            text: (0, Mustache_1.default)(`*${nome}*  ¡Tu conexión está bloqueada! Lo desbloquearé por ti.`, contact),
                                        };
                                        await (0, wbotMessageListener_1.sleep)(2000);
                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPdf);
                                        const bodyqrcode = {
                                            text: (0, Mustache_1.default)(`Estoy concediendo su acceso. ¡Espere por favor!`, contact),
                                        };
                                        await (0, wbotMessageListener_1.sleep)(2000);
                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyqrcode);
                                        //REALIZANDO O DESBLOQUEIO
                                        var optionsdesbloqeuio = {
                                            method: 'POST',
                                            url: `${urlixc}/webservice/v1/desbloqueio_confianca`,
                                            headers: {
                                                Authorization: `Basic ${ixckeybase64}`
                                            },
                                            data: { id: id_contrato }
                                        };
                                        axios_1.default.request(optionsdesbloqeuio).then(async function (response) {
                                            let tipo;
                                            let mensagem;
                                            tipo = response.data?.tipo;
                                            mensagem = response.data?.mensagem;
                                            const body_mensagem = {
                                                text: (0, Mustache_1.default)(`${mensagem}`, contact),
                                            };
                                            if (tipo === 'sucesso') {
                                                //DESCONECTANDO O CLIENTE PARA VOLTAR O ACESSO
                                                var optionsRadius = {
                                                    method: 'GET',
                                                    url: `${urlixc}/webservice/v1/radusuarios`,
                                                    headers: {
                                                        ixcsoft: 'listar',
                                                        Authorization: `Basic ${ixckeybase64}`
                                                    },
                                                    data: {
                                                        qtype: 'radusuarios.id_cliente',
                                                        query: id,
                                                        oper: '=',
                                                        page: '1',
                                                        rp: '1',
                                                        sortname: 'radusuarios.id',
                                                        sortorder: 'asc'
                                                    }
                                                };
                                                axios_1.default.request(optionsRadius).then(async function (response) {
                                                    let tipo;
                                                    tipo = response.data?.type;
                                                    if (tipo === 'success') {
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body_mensagem);
                                                        const bodyPdf = {
                                                            text: (0, Mustache_1.default)(`¡Hice los trámites de liberación! ¡Ahora espere hasta 5 minutos y vea si su conexión regresa! .\n\nSi no has regresado, ¡vuelve a ponerte en contacto y habla con un asistente!`, contact),
                                                        };
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPdf);
                                                        const bodyfinaliza = {
                                                            text: (0, Mustache_1.default)(`¡Estamos terminando esta conversación! Si lo necesitas ¡contáctanos!`, contact),
                                                        };
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                                        await (0, UpdateTicketService_1.default)({
                                                            ticketData: { status: "closed" },
                                                            ticketId: ticket.id,
                                                            companyId: ticket.companyId,
                                                        });
                                                    }
                                                    else {
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body_mensagem);
                                                        const bodyPdf = {
                                                            text: (0, Mustache_1.default)(`Necesitaré que *desconectes* tu equipo del enchufe.\n\n*NOTA: simplemente desconéctalo.* \n¡Espera 1 minuto y enciéndelo nuevamente!`, contact),
                                                        };
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyPdf);
                                                        const bodyqrcode = {
                                                            text: (0, Mustache_1.default)(`¡Comprueba si tu acceso ha vuelto! Si no has regresado, ¡vuelve a ponerte en contacto y habla con un asistente!`, contact),
                                                        };
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyqrcode);
                                                        const bodyfinaliza = {
                                                            text: (0, Mustache_1.default)(`¡Estamos terminando esta conversación! Si lo necesitas ¡contáctanos!`, contact),
                                                        };
                                                        await (0, wbotMessageListener_1.sleep)(2000);
                                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                                        await (0, UpdateTicketService_1.default)({
                                                            ticketData: { status: "closed" },
                                                            ticketId: ticket.id,
                                                            companyId: ticket.companyId,
                                                        });
                                                    }
                                                }).catch(function (error) {
                                                    console.error(error);
                                                });
                                                //FIM DA DESCONEXÃO
                                            }
                                            else {
                                                const bodyerro = {
                                                    text: (0, Mustache_1.default)(`¡Ups! ¡Ocurrió un error y no pude desbloquearlo!`, contact),
                                                };
                                                await (0, wbotMessageListener_1.sleep)(2000);
                                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyerro);
                                                await (0, wbotMessageListener_1.sleep)(2000);
                                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body_mensagem);
                                                const bodyerroatendente = {
                                                    text: (0, Mustache_1.default)(`Escriba *#* y hable con un asistente.`, contact),
                                                };
                                                await (0, wbotMessageListener_1.sleep)(2000);
                                                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyerroatendente);
                                            } /* else {
                                                       const bodyerro = {
                                        text: formatBody(`Ops! Ocorreu um erro e nao consegui desbloquear! Digite *#* e fale com um atendente!`
                                                       await sleep(2000)
                                                       await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,bodyerro);
                                                   } */
                                        }).catch(async function (error) {
                                            const bodyerro = {
                                                text: (0, Mustache_1.default)(`¡Ups! Se produjo un error, escriba *#* y hable con un asistente.`, contact),
                                            };
                                            await (0, wbotMessageListener_1.sleep)(2000);
                                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyerro);
                                        });
                                    }
                                    else {
                                        const bodysembloqueio = {
                                            text: (0, Mustache_1.default)(`¡Tu conexión no está bloqueada! Si tiene dificultades de navegación, vuelva a ponerse en contacto y hable con un representante de servicio al cliente.`, contact),
                                        };
                                        await (0, wbotMessageListener_1.sleep)(2000);
                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodysembloqueio);
                                        const bodyfinaliza = {
                                            text: (0, Mustache_1.default)(`¡Estamos terminando esta conversación! Si lo necesitas ¡contáctanos!`, contact),
                                        };
                                        await (0, wbotMessageListener_1.sleep)(2000);
                                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyfinaliza);
                                        await (0, UpdateTicketService_1.default)({
                                            ticketData: { status: "closed" },
                                            ticketId: ticket.id,
                                            companyId: ticket.companyId,
                                        });
                                    }
                                    //
                                }).catch(async function (error) {
                                    const bodyerro = {
                                        text: (0, Mustache_1.default)(`¡Ups! Se produjo un error, escriba *#* y hable con un asistente.`, contact),
                                    };
                                    await (0, wbotMessageListener_1.sleep)(2000);
                                    await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, bodyerro);
                                });
                            }
                        }).catch(async function (error) {
                            const body = {
                                text: (0, Mustache_1.default)(`*¡¡¡Ups!!!*\¡Ocurrió un error! ¡Escriba *#* y hable con un *Asistente*!`, contact),
                            };
                            await (0, wbotMessageListener_1.sleep)(2000);
                            await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                        });
                    }
                    else {
                        const body = {
                            text: (0, Mustache_1.default)(`¡Este CPF/CNPJ no es válido!\n\n¡Inténtelo de nuevo!\nO escriba *#* para regresar a*Menu Anterior*`, contact),
                        };
                        await (0, wbotMessageListener_1.sleep)(2000);
                        await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, body);
                    }
                }
            }
        }
    }
};
exports.provider = provider;
