import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

interface SuccessAlertProps {
    title?: string;
    description: string;
}

export const SuccessAlert: React.FC<SuccessAlertProps> = ({
    title,
    description,
}) => {
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <Alert className="bg-gradient-to-br from-green-600 to-emerald-700 backdrop-blur-sm border border-emerald-200/50 rounded-lg p-4 shadow-xl">
                <CheckCircle2 className="!text-emerald-200 h-4 w-4" />
                <AlertTitle className="font-bold text-emerald-200">
                    {title ? title : "Success!"}
                </AlertTitle>
                <AlertDescription className="text-white">
                    {description}
                </AlertDescription>
            </Alert>
        </div>
    );
};
