import { AddressDTO } from "@/dto/addressDTO";

export const STORE_PICKUP_ADDRESS: AddressDTO = {
    id: 1,
    favorite: true,
    apelido: 'Retirada no local',
    rua: 'Rua Hélio Laudelino da Silva',
    bairro: 'Bom Viver - Biguaçu',
    cep: '',
    numero: '41',
    complemento: '',
    referencia: 'Assados Zanini',
};

export const STORE_PICKUP_WEEKDAYS = [0, 6];

export const STORE_PICKUP_TIME_WINDOWS = [
    { start: '11:30', end: '12:00' },
    { start: '12:00', end: '12:30' },
    { start: '12:30', end: '13:00' },
    { start: '13:00', end: '13:30' },
    { start: '13:30', end: '14:00' },
];
