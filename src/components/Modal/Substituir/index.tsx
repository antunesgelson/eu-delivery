import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IngredientesDTO, ProdutosDTO } from "@/dto/productDTO";
type Props = {
  open: boolean;
  onClose: () => void;
  removeProduct: IngredientesDTO;
  productDetails: ProdutosDTO;
  onReplace: (
    removeProductId: string,
    replacement: IngredientesDTO | null,
  ) => void;
};
export function ModalSubstituir({
  open,
  onClose,
  removeProduct,
  productDetails,
  onReplace,
}: Props) {
  const [replacement, setReplacement] = React.useState<IngredientesDTO | null>(
    null,
  );
  React.useEffect(() => {
    if (open) setReplacement(removeProduct.replace ?? null);
  }, [open, removeProduct]);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="mx-auto w-11/12 rounded-md sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Substituir {removeProduct.nome}</DialogTitle>
          <DialogDescription>
            Escolha um ingrediente ou mantenha somente a remoção.
          </DialogDescription>
        </DialogHeader>
        <fieldset className="grid grid-cols-2 gap-4">
          <legend className="sr-only">Ingrediente substituto</legend>
          {productDetails.ingredientes
            .filter(
              (i) =>
                i.id !== removeProduct.id &&
                Number(i.valor) <= Number(removeProduct.valor),
            )
            .map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="substituicao"
                  checked={replacement?.id === item.id}
                  onChange={() => setReplacement(item)}
                />
                {item.nome}
              </label>
            ))}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="substituicao"
              checked={!replacement}
              onChange={() => setReplacement(null)}
            />
            Nenhum
          </label>
        </fieldset>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
          <Button
            variant="success"
            onClick={() => {
              onReplace(removeProduct.id, replacement);
              onClose();
            }}
          >
            Substituir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
