import React from "react";
import { Calendar, Brain } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenCoach?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onOpenCoach }) => {
  return (
    <div className="bg-indigo-600 text-white p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex items-center">
          <button type="button" className="p-2 bg-indigo-500 rounded-full mr-2">
            <Calendar size={20} />
          </button>
          {onOpenCoach && (
            <button
              type="button"
              className="p-2 bg-indigo-500 rounded-full"
              onClick={onOpenCoach}
            >
              <Brain size={20} />
            </button>
          )}
        </div>
      </div>
      {subtitle && <p className="text-indigo-200 mt-1">{subtitle}</p>}
    </div>
  );
};

export default Header;
