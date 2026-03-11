export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary-600">만실</h1>
                    <p className="text-gray-500 mt-2">부동산 중개사를 위한 올인원 플랫폼</p>
                </div>
                {children}
            </div>
        </div>
    );
}
