const fs = require('fs-extra');
const path = require('path');

/**
 * Sistema de configuração local com JSON
 * Preparado para futura integração com API Laravel
 */

// Paths dos arquivos de configuração
const CONFIG_DIR = path.join(__dirname, '../data');
const GROUPS_CONFIG_FILE = path.join(CONFIG_DIR, 'groups.json');
const ADS_CONFIG_FILE = path.join(CONFIG_DIR, 'ads.json');
const SCHEDULES_CONFIG_FILE = path.join(CONFIG_DIR, 'schedules.json');
const HORARIOS_CONFIG_FILE = path.join(CONFIG_DIR, 'horarios.json');

/**
 * Garantir que o diretório de dados existe
 */
async function ensureDataDir() {
    await fs.ensureDir(CONFIG_DIR);
}

/**
 * Salvar configuração específica de um grupo
 * @param {string} groupId - ID do grupo (ex: 558899999999-111111@g.us)
 * @param {string} key - Chave da configuração
 * @param {any} value - Valor a ser salvo
 */
async function saveConfig(groupId, key, value) {
    try {
        await ensureDataDir();
        
        // Carregar configurações existentes
        let configs = {};
        if (await fs.pathExists(GROUPS_CONFIG_FILE)) {
            configs = await fs.readJson(GROUPS_CONFIG_FILE);
        }
        
        // Inicializar grupo se não existe
        if (!configs[groupId]) {
            configs[groupId] = {};
        }
        
        // Salvar configuração
        configs[groupId][key] = value;
        configs[groupId].lastUpdate = new Date().toISOString();
        
        // Escrever arquivo
        await fs.writeJson(GROUPS_CONFIG_FILE, configs, { spaces: 2 });
        
        console.log(`✅ Configuração salva: ${groupId} -> ${key}`);
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao salvar configuração:', error);
        return false;
    }
}

/**
 * Carregar todas as configurações de um grupo
 * @param {string} groupId - ID do grupo
 * @returns {object} Configurações do grupo
 */
async function loadConfig(groupId) {
    try {
        await ensureDataDir();
        
        if (!(await fs.pathExists(GROUPS_CONFIG_FILE))) {
            return {};
        }
        
        const configs = await fs.readJson(GROUPS_CONFIG_FILE);
        return configs[groupId] || {};
        
    } catch (error) {
        console.error('❌ Erro ao carregar configuração:', error);
        return {};
    }
}

/**
 * Carregar configuração específica de um grupo
 * @param {string} groupId - ID do grupo
 * @param {string} key - Chave da configuração
 * @param {any} defaultValue - Valor padrão se não encontrar
 * @returns {any} Valor da configuração
 */
async function getConfig(groupId, key, defaultValue = null) {
    const config = await loadConfig(groupId);
    return config[key] !== undefined ? config[key] : defaultValue;
}

/**
 * Salvar dados de anúncios
 * @param {object} adsData - Dados dos anúncios
 */
async function saveAdsData(adsData) {
    try {
        await ensureDataDir();
        await fs.writeJson(ADS_CONFIG_FILE, adsData, { spaces: 2 });
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar anúncios:', error);
        return false;
    }
}

/**
 * Carregar dados de anúncios
 * @returns {object} Dados dos anúncios
 */
async function loadAdsData() {
    try {
        await ensureDataDir();
        
        if (!(await fs.pathExists(ADS_CONFIG_FILE))) {
            return {};
        }
        
        return await fs.readJson(ADS_CONFIG_FILE);
        
    } catch (error) {
        console.error('❌ Erro ao carregar anúncios:', error);
        return {};
    }
}

/**
 * Salvar agendamentos
 * @param {object} schedulesData - Dados dos agendamentos
 */
async function saveSchedulesData(schedulesData) {
    try {
        await ensureDataDir();
        await fs.writeJson(SCHEDULES_CONFIG_FILE, schedulesData, { spaces: 2 });
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar agendamentos:', error);
        return false;
    }
}

/**
 * Carregar agendamentos
 * @returns {object} Dados dos agendamentos
 */
async function loadSchedulesData() {
    try {
        await ensureDataDir();
        
        if (!(await fs.pathExists(SCHEDULES_CONFIG_FILE))) {
            return {};
        }
        
        return await fs.readJson(SCHEDULES_CONFIG_FILE);
        
    } catch (error) {
        console.error('❌ Erro ao carregar agendamentos:', error);
        return {};
    }
}

/**
 * Salvar dados de horários pagantes
 * @param {object} horariosData - Dados dos horários
 */
async function saveHorariosData(horariosData) {
    try {
        await ensureDataDir();
        await fs.writeJson(HORARIOS_CONFIG_FILE, horariosData, { spaces: 2 });
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar horários:', error);
        return false;
    }
}

/**
 * Carregar dados de horários pagantes
 * @returns {object} Dados dos horários
 */
async function loadHorariosData() {
    try {
        await ensureDataDir();
        
        if (!(await fs.pathExists(HORARIOS_CONFIG_FILE))) {
            return {};
        }
        
        return await fs.readJson(HORARIOS_CONFIG_FILE);
        
    } catch (error) {
        console.error('❌ Erro ao carregar horários:', error);
        return {};
    }
}

/**
 * Verificar se grupo está ativo (para futura integração com Laravel)
 * @param {string} groupId - ID do grupo
 * @returns {boolean} Se o grupo está ativo
 */
async function isGroupActive(groupId) {
    // Por enquanto, todos os grupos são considerados ativos
    // No futuro, isso consultará o status via API Laravel
    const config = await getConfig(groupId, 'status', 'active');
    return config === 'active';
}

/**
 * Listar todos os grupos salvos
 * @returns {array} Lista de IDs dos grupos
 */
async function getAllGroups() {
    try {
        await ensureDataDir();
        
        if (!(await fs.pathExists(GROUPS_CONFIG_FILE))) {
            return [];
        }
        
        const configs = await fs.readJson(GROUPS_CONFIG_FILE);
        return Object.keys(configs);
        
    } catch (error) {
        console.error('❌ Erro ao listar grupos:', error);
        return [];
    }
}

module.exports = {
    saveConfig,
    loadConfig,
    getConfig,
    saveAdsData,
    loadAdsData,
    saveSchedulesData,
    loadSchedulesData,
    saveHorariosData,
    loadHorariosData,
    isGroupActive,
    getAllGroups
};