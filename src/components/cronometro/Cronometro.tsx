import { motion } from 'framer-motion';
import { useTimer } from '../../hooks/useTimer';
import { TopBar } from '../ui/TopBar';

interface Props {
  onMenuClick: () => void;
}

export function Cronometro({ onMenuClick }: Props) {
  const { tiempoFormateado, progresoGrados, isActivo, toggleTimer, resetTimer } = useTimer(720);

  return (
    <section className="absolute top-0 left-0 w-full h-full p-5 pb-[100px] overflow-y-auto no-scrollbar">
      <TopBar title="Timer" onMenuClick={onMenuClick} />

      <div className="bg-white p-[30px] rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] flex flex-col items-center gap-[25px] mt-5">
        <div
          className="w-[200px] h-[200px] rounded-full flex items-center justify-center shadow-[4px_4px_10px_#e6e6e6] transition-[background] duration-1000 ease-linear"
          style={{ background: `conic-gradient(#7f70ff ${progresoGrados}deg, #f0f0f0 0deg)` }}
        >
          <div className="w-[175px] h-[175px] bg-white rounded-full flex items-center justify-center shadow-[inset_4px_4px_8px_#e6e6e6,inset_-4px_-4px_8px_#ffffff]">
            <motion.span
              key={tiempoFormateado}
              className="text-4xl font-bold text-[#333333] tabular-nums"
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {tiempoFormateado}
            </motion.span>
          </div>
        </div>

        <div className="flex gap-5">
          <motion.button
            onClick={toggleTimer}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="w-[50px] h-[50px] border-none rounded-full bg-white text-xl cursor-pointer shadow-[4px_4px_8px_#e6e6e6,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_#e6e6e6] flex items-center justify-center transition-shadow"
          >
            {isActivo ? '⏸️' : '▶️'}
          </motion.button>
          <motion.button
            onClick={resetTimer}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="w-[50px] h-[50px] border-none rounded-full bg-white text-xl cursor-pointer shadow-[4px_4px_8px_#e6e6e6,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_5px_#e6e6e6] flex items-center justify-center transition-shadow"
          >
            ⏹️
          </motion.button>
        </div>
      </div>
    </section>
  );
}
