import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '이용약관',
    description: '만실 플랫폼 이용약관',
};

export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">이용약관</h1>
            <p className="text-sm text-gray-500 mb-8">시행일: 2026년 2월 26일 | 버전 1.0</p>

            <div className="prose prose-sm max-w-none space-y-8">
                <section>
                    <h2 className="text-lg font-semibold mb-3">제1조 (목적)</h2>
                    <p className="text-gray-700 leading-relaxed">
                        이 약관은 만실(이하 &quot;회사&quot;)이 제공하는 부동산 관리 플랫폼 서비스(이하
                        &quot;서비스&quot;)의 이용조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항 등을
                        규정함을 목적으로 합니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제2조 (정의)</h2>
                    <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                        <li>&quot;서비스&quot;란 회사가 제공하는 부동산 매물 관리, 고객 관리, 계약 관리, 일정 관리, 커뮤니티 등 관련 제반 서비스를 의미합니다.</li>
                        <li>&quot;이용자&quot;란 이 약관에 따라 회사와 이용계약을 체결하고 서비스를 이용하는 자를 말합니다.</li>
                        <li>&quot;계정&quot;이란 이용자의 식별과 서비스 이용을 위하여 이용자가 설정한 이메일과 비밀번호의 조합을 말합니다.</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제3조 (약관의 효력 및 변경)</h2>
                    <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                        <li>이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.</li>
                        <li>회사는 합리적인 사유가 발생할 경우 관련 법령에 위배되지 않는 범위에서 이 약관을 변경할 수 있으며, 변경된 약관은 플랫폼 내 공지사항을 통해 7일 이전에 공지합니다.</li>
                        <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제4조 (이용계약의 체결)</h2>
                    <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                        <li>이용계약은 이용자가 약관에 동의하고 회원가입을 완료한 시점에 성립합니다.</li>
                        <li>회사는 다음 각 호에 해당하는 경우 이용계약을 거절할 수 있습니다:
                            <ul className="list-disc pl-5 mt-1">
                                <li>타인의 정보를 도용한 경우</li>
                                <li>허위의 정보를 기재한 경우</li>
                                <li>기술상 서비스 제공이 불가능한 경우</li>
                            </ul>
                        </li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제5조 (서비스의 내용)</h2>
                    <p className="text-gray-700 leading-relaxed">회사가 제공하는 서비스는 다음과 같습니다.</p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1 text-gray-700">
                        <li>부동산 매물 등록 및 관리</li>
                        <li>고객(임대인·임차인) 정보 관리</li>
                        <li>계약 관리 및 수수료 장부 관리</li>
                        <li>일정 및 팔로업 관리</li>
                        <li>커뮤니티 게시판</li>
                        <li>실거래가 조회</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제6조 (이용자의 의무)</h2>
                    <p className="text-gray-700 leading-relaxed">이용자는 다음 행위를 하여서는 안 됩니다.</p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1 text-gray-700">
                        <li>가입 시 허위 정보를 등록하는 행위</li>
                        <li>타인의 정보를 도용하거나 부정하게 사용하는 행위</li>
                        <li>서비스를 이용하여 법령 또는 공서양속에 반하는 행위</li>
                        <li>회사의 서비스 운영을 방해하는 행위</li>
                        <li>다른 이용자의 개인정보를 무단으로 수집·저장·공개하는 행위</li>
                        <li>서비스를 영리 목적 외의 부정한 방법으로 이용하는 행위</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제7조 (회사의 의무)</h2>
                    <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                        <li>회사는 관련 법령과 이 약관이 정하는 바에 따라 지속적이고 안정적으로 서비스를 제공하기 위해 노력합니다.</li>
                        <li>회사는 이용자의 개인정보를 「개인정보 보호법」 등 관련 법규에 따라 보호합니다.</li>
                        <li>회사는 서비스 이용과 관련한 이용자의 불만 또는 피해구제 요청을 적절하게 처리할 수 있도록 필요한 인력 및 시스템을 구비합니다.</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제8조 (서비스의 중단)</h2>
                    <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                        <li>회사는 시스템 점검, 교체, 고장, 통신장애 등 불가피한 사유가 발생한 경우 서비스의 전부 또는 일부를 일시적으로 중단할 수 있습니다.</li>
                        <li>서비스 중단의 경우 사전에 공지하며, 불가피한 경우 사후에 공지할 수 있습니다.</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제9조 (계약 해지 및 이용 제한)</h2>
                    <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                        <li>이용자는 언제든지 서비스 내 계정 삭제 기능 또는 고객센터를 통해 이용계약의 해지를 요청할 수 있으며, 회사는 지체 없이 처리합니다.</li>
                        <li>회사는 이용자가 제6조의 의무를 위반한 경우 사전 통지 후 서비스 이용을 제한하거나 이용계약을 해지할 수 있습니다.</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제10조 (면책조항)</h2>
                    <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                        <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.</li>
                        <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.</li>
                        <li>회사는 이용자가 서비스를 통해 등록한 정보의 정확성, 신뢰성에 대하여 책임을 지지 않습니다.</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제11조 (분쟁해결)</h2>
                    <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                        <li>회사와 이용자 간 발생한 분쟁에 대해서는 대한민국 법을 적용합니다.</li>
                        <li>서비스 이용과 관련하여 분쟁이 발생한 경우 회사의 본사 소재지를 관할하는 법원을 합의관할 법원으로 합니다.</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">부칙</h2>
                    <p className="text-gray-700 leading-relaxed">
                        이 약관은 2026년 2월 26일부터 시행합니다.
                    </p>
                </section>
            </div>
        </div>
    );
}
