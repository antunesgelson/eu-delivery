
import { Progress } from "@/components/ui/progress"

type Props = {
    size: number
    currentStep: number
}
export default function MultiStep({ size, currentStep }: Props) {
    return (
        <div className="w-full">
            <span className="text-muted-foreground dark:text-muted text-xs duration-300 flex justify-start">Passo {currentStep} de {size}</span>
            <div className="flex items-center gap-0.5">
                {Array.from({ length: size }).map((_, index) => (
                    <Progress key={index} value={index < currentStep ? 100 : 0} className="h-1 dark:bg-dark-400" />
                ))}
            </div>
        </div>

    )
}