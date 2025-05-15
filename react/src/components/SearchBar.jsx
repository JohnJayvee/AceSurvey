import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function SearchBar({ searchTerm, onSearch }) {
    return (
        <div className="relative">
            <div className="relative flex items-center">
                <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 left-3" />
                <input
                    type="text"
                    placeholder="Search surveys..."
                    className="w-full px-10 py-2.5 text-sm bg-white border border-gray-300 rounded-lg
                             focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                             transition-all duration-300 ease-in-out"
                    value={searchTerm}
                    onChange={(e) => onSearch(e.target.value)}
                />
                {searchTerm && (
                    <button
                        onClick={() => onSearch('')}
                        className="absolute p-1 transition-colors duration-200 rounded-full right-3 hover:bg-gray-100"
                    >
                        <XMarkIcon className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>
        </div>
    );
}
