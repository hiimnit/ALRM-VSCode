import * as vscode from 'vscode';
import { showWarningMessage } from '../helpers/userInteraction';
import { IIntegrationApi } from './api/IIntegrationApi';
import IntegrationApiv1n0 from './api/IntegrationApiv1n0';
import IntegrationApiv1n1 from './api/IntegrationApiv1n1';
import { ISnippets } from './snippets/ISnippets';
import SnippetsDefault from './snippets/SnippetsDefault';
import SnippetsWaldo from './snippets/SnippetsWaldo';

export const CONFIG_KEY = 'al-id-range-manager';
export const AUTH_TYPE_BASIC = 'Basic';

export default class Settings {
    private _apiBaseUrl?: string;
    private _apiTenant?: string;
    private _apiUsername?: string;
    private _apiPassword?: string;
    private _authenticationType?: string;
    private _integrationApi?: IIntegrationApi;
    private _snippets?: ISnippets;
    private static _instance: Settings;

    public get apiBaseUrl(): string { return this._apiBaseUrl || ''; }
    public get apiTenant(): string { return this._apiTenant || ''; }
    public get apiUsername(): string { return this._apiUsername || ''; }
    public get apiPassword(): string { return this._apiPassword || ''; }
    public get authenticationType(): string { return this._authenticationType || ''; }
    public get integrationApi(): IIntegrationApi { return this._integrationApi || IntegrationApiv1n0.instance; }
    public get snippets(): ISnippets { return this._snippets || SnippetsDefault.instance; }

    private constructor() {
        this.parseConfig();
    }

    public static get instance(): Settings {
        return this._instance || (this._instance = new this());
    }

    private parseConfig() {
        const config = vscode.workspace.getConfiguration(CONFIG_KEY);

        const selectedApiVersion = config.get('apiVersion');
        switch (selectedApiVersion) {
            case '1.1':
                this._integrationApi = IntegrationApiv1n1.instance;
                break;
            default:
                this._integrationApi = IntegrationApiv1n0.instance;
                break;
        }
        if (this._integrationApi.isDeprecated()) {
            showWarningMessage('You are using deprecated API version ' + selectedApiVersion + '. Please update your BC backend app & setting in the VS Code.');
        }

        const selectedSnippets = config.get('snippets');
        switch (selectedSnippets) {
            case 'Waldo\'s CRS AL Language Snippets':
                this._snippets = SnippetsWaldo.instance;
                break;
            default:
                this._snippets = SnippetsDefault.instance;
                break;
        }
        this._apiBaseUrl = config.get('baseUrlWithoutVersion');
        if (!this._apiBaseUrl?.endsWith('/')) {
            this._apiBaseUrl += '/';
        }
        this._apiBaseUrl += this._integrationApi.getApiVersionURLFormatted() + '/';
        const companyId = config.get('companyId');
        if (companyId !== '') {
            this._apiBaseUrl += 'companies(' + companyId + ')/';
        }
        this._apiTenant = config.get('tenant');
        this._apiUsername = config.get('username');
        this._apiPassword = config.get('password');
        this._authenticationType = config.get('authenticationType');
    }

    public validate(): boolean {
        if (this.apiBaseUrl === '' || this.apiUsername === '' || this.apiPassword === '') {
            return false;
        }
        return true;
    }
}