import { useState, useRef } from 'react';
import { 
  useFloating, 
  useInteractions,
  useClick,
  useDismiss,
  offset,
  flip,
  shift,
  autoUpdate,
  FloatingFocusManager
} from '@floating-ui/react';
import { models } from "@/constants/models";
import { motion } from "motion/react";
import { CaretDown } from "@phosphor-icons/react";

interface ModelSelectorProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export default function ModelSelector({ 
  selectedModel, 
  setSelectedModel 
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const references = useRef<Array<HTMLElement | null>>([]);
  
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    placement: window.innerWidth < 640 ? 'bottom' : 'top-start',
    onOpenChange: setIsOpen,
    middleware: [
      offset(5),
      flip({ padding: 8 }),
      shift({ padding: 8 })
    ],
    whileElementsMounted: autoUpdate
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss
  ]);

  const selectedModelData = models.find(model => model.id === selectedModel) || models[0];

  return (
    <div>
      <button
        className="w-full sm:w-auto bg-sage-1 dark:bg-sage-3 px-3 py-2 sm:px-2 sm:py-1 text-sm flex items-center justify-center gap-2 rounded-md border border-sage-3 dark:border-sage-5 hover:bg-sage-2 dark:hover:bg-sage-4 transition-colors cursor-pointer text-sage-10 dark:text-sage-11"
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <span className="truncate">{selectedModelData.name}</span>
        <CaretDown size={12} weight="bold" className={`transition-transform ${isOpen ? 'rotate-180' : ''} flex-shrink-0`} />
      </button>

      {isOpen && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="bg-white dark:bg-sage-3 shadow-md border border-sage-4 dark:border-sage-5 rounded-md z-50 w-[calc(100vw-1rem)] sm:w-auto max-w-sm overflow-hidden"
          >
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ duration: 0.15, staggerChildren: 0.04, staggerDirection: -1 }}
              className="divide-y divide-sage-4"
              variants={{
                open: { opacity: 1, y: 0 },
                closed: { opacity: 0, y: 10 }
              }}
            >
              {models.map((model, index) => (
                <motion.button
                  key={model.id}
                  ref={(node) => {
                    references.current[index] = node;
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-sage-2 dark:hover:bg-sage-4 transition-colors flex flex-row items-center gap-4 justify-between ${
                    selectedModel === model.id ? 'bg-sage-2 dark:bg-sage-4 text-sage-12' : 'text-sage-11'
                  }`}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setIsOpen(false);
                  }}
                  variants={{
                    open: { opacity: 1, y: 0 },
                    closed: { opacity: 0, y: -10 }
                  }}
                >
                  <div className="flex flex-col">
                    <p className="text-xs font-medium">
                      {model.name}
                    </p>
                    {/* <p className="text-xs text-sage-10">
                      {model.description}
                    </p> */}
                  </div>

                  <div className="flex-none hidden sm:flex flex-row gap-4 ml-auto">
                    <div className="flex flex-col gap-px">
                      <p className="text-[10px] uppercase font-mono text-sage-10">
                        Speed
                      </p>
                      <div className="relative h-1 rounded-full bg-sage-5 w-16 sm:w-20 overflow-hidden">
                        <div 
                          className={`absolute inset-0 ${(model.speed/300) * 100 > 60 ? 'bg-gradient-to-r from-grass-10 to-grass-8' : 'bg-gradient-to-r from-amber-10 to-amber-8'} rounded-full`} 
                          style={{ width: `${(model.speed/300) * 100}%` }} 
                        />
                      </div>
                
                    </div>

                    <div className="flex flex-col gap-px">
                      <p className="text-[10px] uppercase font-mono text-sage-10">
                        Intelligence
                      </p>
                      <div className="relative h-1 rounded-full bg-sage-5 w-16 sm:w-20 overflow-hidden">
                        <div 
                          className={`absolute inset-0 ${(model.intelligence/80) * 100 > 60 ? 'bg-gradient-to-r from-grass-10 to-grass-8' : 'bg-gradient-to-r from-amber-10 to-amber-8'} rounded-full`} 
                          style={{ width: `${(model.intelligence/80) * 100}%` }} 
                        />
                      </div>
                
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </FloatingFocusManager>
      )}
    </div>
  );
} 