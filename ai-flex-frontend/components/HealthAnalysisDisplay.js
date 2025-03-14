import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Pill, ShieldAlert, Stethoscope } from "lucide-react"

export function HealthAnalysisDisplay({ data }) {
  const conditions = (data?.possibleConditions || []).slice(0, 3)
  const symptoms = (data?.symptoms || []).slice(0, 3)
  const remedies = (data?.remedies || []).slice(0, 3)
  const precautions = (data?.precautions || []).slice(0, 3)

  const renderItem = (item) => {
    if (typeof item === "string") {
      return item
    } else if (item && typeof item === "object") {
      return (
        <div>
          <div className="font-medium">{item.name}</div>
          {item.description && <div className="text-sm text-slate-300 mt-1">{item.description}</div>}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
      <Tabs defaultValue="conditions">
        <TabsList className="w-full bg-slate-800 border-b border-slate-700 rounded-none h-auto p-0 flex flex-nowrap overflow-x-auto scrollbar-hide">
          <TabsTrigger
            value="conditions"
            className="flex items-center gap-1 py-2 md:py-3 px-2 md:px-4 text-xs sm:text-sm rounded-md sm:rounded-none m-1 data-[state=active]:bg-slate-700 whitespace-nowrap"
          >
            <Stethoscope size={16} className="hidden md:inline" />
            <span className="md:hidden">Cond.</span>
            <span className="hidden md:inline">Conditions</span>
            {conditions.length > 0 && <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{conditions.length}</span>}
          </TabsTrigger>
          <TabsTrigger
            value="symptoms"
            className="flex items-center gap-1 py-2 md:py-3 px-2 md:px-4 text-xs sm:text-sm rounded-md sm:rounded-none m-1 data-[state=active]:bg-slate-700 whitespace-nowrap"
          >
            <AlertCircle size={16} className="hidden md:inline" />
            <span className="md:hidden">Symp.</span>
            <span className="hidden md:inline">Symptoms</span>
            {symptoms.length > 0 && <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{symptoms.length}</span>}
          </TabsTrigger>
          <TabsTrigger
            value="remedies"
            className="flex items-center gap-1 py-2 md:py-3 px-2 md:px-4 text-xs sm:text-sm rounded-md sm:rounded-none m-1 data-[state=active]:bg-slate-700 whitespace-nowrap"
          >
            <Pill size={16} className="hidden md:inline" />
            <span className="md:hidden">Rem.</span>
            <span className="hidden md:inline">Remedies</span>
            {remedies.length > 0 && <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{remedies.length}</span>}
          </TabsTrigger>
          <TabsTrigger
            value="precautions"
            className="flex items-center gap-1 py-2 md:py-3 px-2 md:px-4 text-xs sm:text-sm rounded-md sm:rounded-none m-1 data-[state=active]:bg-slate-700 whitespace-nowrap"
          >
            <ShieldAlert size={16} className="hidden md:inline" />
            <span className="md:hidden">Prec.</span>
            <span className="hidden md:inline">Precautions</span>
            {precautions.length > 0 && <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{precautions.length}</span>}
          </TabsTrigger>
        </TabsList>

        <CardContent className="p-2 sm:p-4">
          <TabsContent value="conditions" className="mt-0">
            <ul className="space-y-2">
              {conditions.length > 0 ? (
                conditions.map((condition, index) => (
                  <li key={index} className="bg-slate-700/50 p-2 sm:p-3 rounded-lg">
                    {renderItem(condition)}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground italic">No conditions identified</li>
              )}
            </ul>
          </TabsContent>

          <TabsContent value="symptoms" className="mt-0">
            <ul className="space-y-2">
              {symptoms.length > 0 ? (
                symptoms.map((symptom, index) => (
                  <li key={index} className="bg-slate-700/50 p-2 sm:p-3 rounded-lg">
                    {renderItem(symptom)}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground italic">No symptoms listed</li>
              )}
            </ul>
          </TabsContent>

          <TabsContent value="remedies" className="mt-0">
            <ul className="space-y-2">
              {remedies.length > 0 ? (
                remedies.map((remedy, index) => (
                  <li key={index} className="bg-slate-700/50 p-2 sm:p-3 rounded-lg">
                    {renderItem(remedy)}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground italic">No remedies suggested</li>
              )}
            </ul>
          </TabsContent>

          <TabsContent value="precautions" className="mt-0">
            <ul className="space-y-2">
              {precautions.length > 0 ? (
                precautions.map((precaution, index) => (
                  <li key={index} className="bg-slate-700/50 p-2 sm:p-3 rounded-lg">
                    {renderItem(precaution)}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground italic">No precautions advised</li>
              )}
            </ul>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
