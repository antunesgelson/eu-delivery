import { useCallback } from 'react';

const useFormatters = () => {
    const cpfFormat = useCallback((cpf: string) => {
        if (!cpf) return cpf;
        const cleaned = cpf.replace(/\D/g, '');
        let formatted = cleaned;

        if (cleaned.length > 0) {
            formatted = cleaned.substring(0, 3);
        }
        if (cleaned.length >= 4) {
            formatted += `.${cleaned.substring(3, 6)}`;
        }
        if (cleaned.length >= 7) {
            formatted += `.${cleaned.substring(6, 9)}`;
        }
        if (cleaned.length >= 10) {
            formatted += `-${cleaned.substring(9, 11)}`;
        }
        return formatted;
    }, []);

    const cellPhoneFormat = useCallback((phone: string) => {
        if (!phone) return phone;
        const cleaned = phone.replace(/\D/g, '');
        let formatted = cleaned;

        if (cleaned.length > 0) {
            formatted = `(${cleaned.substring(0, 2)}`;
        }
        if (cleaned.length >= 3) {
            formatted += `) ${cleaned.substring(2, 7)}`;
        }
        if (cleaned.length >= 8) {
            formatted += `-${cleaned.substring(7, 11)}`;
        }
        return formatted;
    }, []);

    const homePhoneFormat = useCallback((phone: string) => {
        if (!phone) return phone;
        const cleaned = phone.replace(/\D/g, '');
        let formatted = cleaned;

        if (cleaned.length > 0) {
            formatted = `(${cleaned.substring(0, 2)}`;
        }
        if (cleaned.length >= 3) {
            formatted += `) ${cleaned.substring(2, 6)}`; // 4 dígitos após o DDD
        }
        if (cleaned.length >= 7) {
            formatted += `-${cleaned.substring(6, 10)}`; // 4 dígitos finais
        }
        return formatted;
    }, []);

    const cepFormat = useCallback((cep: string) => {
        if (!cep) return cep;
        const cleaned = cep.replace(/\D/g, '');
        let formatted = cleaned;

        if (cleaned.length >= 5) {
            formatted = `${cleaned.substring(0, 5)}-${cleaned.substring(5, 8)}`;
        }

        return formatted;
    }, []);

    return { cpfFormat, cellPhoneFormat, homePhoneFormat, cepFormat };
};

export default useFormatters;