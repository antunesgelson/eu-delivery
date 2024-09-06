export type AddressDTO = {
    id: number,
    favorite: boolean,
    apelido: string,
    rua: string,
    bairro: string,
    cep: string,
    numero: string,
    complemento: string,
    referencia: string,
}

export type LocationDTO = {
    lat: number;
    lng: number;
}