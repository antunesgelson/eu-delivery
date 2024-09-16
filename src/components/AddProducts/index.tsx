import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'


export default function AddProducts() {
    return (
        <section className=" rounded-lg p-6  mx-2 dark:bg-[#1d1d1d] dark:border dark:border-stone-500 dark:border-dashed ">
            <h1 className="py-4 text-xl">Adicionar Produto:</h1>
            <form className="space-y-2">
                <div className=" grid grid-cols-2 gap-2">
                    <Input
                        type="text"
                        label='Nome'
                    />

                    <div className="">
                        <Input
                            type="file"
                            label="Imagem" />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className=" ">
                        <Input
                            type="text"
                            label='Preço' />
                    </div>

                    <div className=" ">
                        <Input
                            type="text"
                            label='Valor Promocional' />
                    </div>

                    <div className=" ">
                        <Input
                            type="text"
                            label="Tamanho da Porção" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 ">
                    <div className=" ">
                        <Input
                            type="text"
                            label="LimitItens" />
                    </div>

                    <div className=" flex flex-col">
                        <Label className="py-1 text-xs text-muted" htmlFor="category">Categoria</Label>
                        <Select>
                            <SelectTrigger className="">
                                <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Fruits</SelectLabel>
                                    <SelectItem value="apple">Apple</SelectItem>
                                    <SelectItem value="banana">Banana</SelectItem>
                                    <SelectItem value="blueberry">Blueberry</SelectItem>
                                    <SelectItem value="grapes">Grapes</SelectItem>
                                    <SelectItem value="pineapple">Pineapple</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>


                </div>

                <div className="flex flex-col ">
                    <Label className='text-xs text-muted' htmlFor="description">Descrição</Label>
                    <Textarea name="description" id="description" cols={20} rows={8}></Textarea>
                </div>

                <div className='flex justify-end py-2'>
                    <Button
                        variant={'outline'}
                        type="submit">
                        Adicionar
                    </Button>
                </div>
            </form>
        </section>
    )
}