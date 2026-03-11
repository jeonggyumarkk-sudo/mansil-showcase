'use client';

import * as React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
    label?: string;
    onChange?: (files: FileList | null) => void;
    accept?: string;
    multiple?: boolean;
}

export function FileUpload({ label, onChange, accept, multiple }: FileUploadProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [fileCount, setFileCount] = React.useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFileCount(e.target.files.length);
            onChange?.(e.target.files);
        }
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div
                onClick={() => fileInputRef.current?.click()}
                className="
          border-2 border-dashed border-gray-300 rounded-lg p-6
          flex flex-col items-center justify-center text-center cursor-pointer
          hover:bg-gray-50 hover:border-primary-500 transition-colors
        "
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleChange}
                    accept={accept}
                    multiple={multiple}
                />
                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center mb-2 text-primary-600">
                    <Upload className="w-5 h-5" />
                </div>
                <div className="text-sm text-gray-600">
                    <span className="font-medium text-primary-600">클릭하여 업로드</span> 또는 드래그 앤 드롭
                </div>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (최대 10MB)</p>

                {fileCount > 0 && (
                    <div className="mt-4 px-3 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                        {fileCount}개 파일 선택됨
                    </div>
                )}
            </div>
        </div>
    );
}
