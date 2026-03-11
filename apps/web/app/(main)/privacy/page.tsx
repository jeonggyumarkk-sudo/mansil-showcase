import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '개인정보 처리방침',
    description: '만실 플랫폼 개인정보 처리방침',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">개인정보 처리방침</h1>
            <p className="text-sm text-gray-500 mb-8">시행일: 2026년 2월 26일 | 버전 1.0</p>

            <div className="prose prose-sm max-w-none space-y-8">
                <section>
                    <h2 className="text-lg font-semibold mb-3">제1조 (개인정보의 처리 목적)</h2>
                    <p className="text-gray-700 leading-relaxed">
                        만실(이하 &quot;회사&quot;)은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는
                        개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는
                        경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를
                        이행할 예정입니다.
                    </p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1 text-gray-700">
                        <li>회원 가입 및 관리: 회원 가입의사 확인, 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지</li>
                        <li>부동산 중개 서비스 제공: 매물 관리, 고객 관리, 계약 관리, 일정 관리</li>
                        <li>커뮤니티 서비스 제공: 게시물 작성 및 관리</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제2조 (처리하는 개인정보의 항목)</h2>
                    <p className="text-gray-700 leading-relaxed">회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
                    <div className="mt-2">
                        <h3 className="font-medium text-gray-800">1. 필수 항목</h3>
                        <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-700">
                            <li>이메일 주소: 회원 식별 및 로그인</li>
                            <li>이름: 서비스 내 표시 및 본인 확인</li>
                            <li>비밀번호: 계정 보안 (암호화하여 저장)</li>
                        </ul>
                    </div>
                    <div className="mt-2">
                        <h3 className="font-medium text-gray-800">2. 선택 항목</h3>
                        <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-700">
                            <li>고객 전화번호: 고객 연락 및 관리</li>
                            <li>고객 이메일: 고객 연락 및 관리</li>
                        </ul>
                    </div>
                    <div className="mt-2">
                        <h3 className="font-medium text-gray-800">3. 자동 수집 항목</h3>
                        <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-700">
                            <li>접속 IP 주소: 동의 기록 관리</li>
                            <li>서비스 이용 기록: 서비스 개선</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제3조 (개인정보의 처리 및 보유 기간)</h2>
                    <p className="text-gray-700 leading-relaxed">
                        회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에
                        동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
                        <li>회원 정보: 회원 탈퇴 시까지. 탈퇴 후 1년간 보관 후 파기</li>
                        <li>계약 관련 정보: 계약 종료 후 5년 (「상법」에 따른 상거래 관련 기록 보존)</li>
                        <li>동의 기록: 동의 철회 후 3년 (「개인정보 보호법」 시행령 제17조)</li>
                        <li>부동산 거래 기록: 거래 완료 후 5년 (「공인중개사법」에 따른 보존 의무)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제4조 (개인정보의 제3자 제공)</h2>
                    <p className="text-gray-700 leading-relaxed">
                        회사는 정보주체의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며,
                        정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에
                        해당하는 경우에만 개인정보를 제3자에게 제공합니다.
                    </p>
                    <p className="text-gray-700 mt-2">현재 개인정보를 제3자에게 제공하고 있지 않습니다.</p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제5조 (개인정보처리의 위탁)</h2>
                    <p className="text-gray-700 leading-relaxed">
                        회사는 현재 개인정보 처리업무를 외부에 위탁하고 있지 않습니다. 향후 위탁이
                        필요한 경우 「개인정보 보호법」 제26조에 따라 위탁계약 시 관련 법규의 준수,
                        개인정보 비밀유지, 제3자 제공 금지 등의 내용을 명확히 규정하겠습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
                    <p className="text-gray-700 leading-relaxed">
                        정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수
                        있습니다.
                    </p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1 text-gray-700">
                        <li>개인정보 열람 요구: 마이페이지 또는 API(GET /users/me/data)를 통해 보유 중인 개인정보를 열람할 수 있습니다.</li>
                        <li>개인정보 정정·삭제 요구: 마이페이지 또는 API(PATCH /users/me)를 통해 개인정보를 정정할 수 있습니다.</li>
                        <li>개인정보 처리정지 요구: 마이페이지 또는 API(DELETE /users/me)를 통해 계정 삭제를 요청할 수 있습니다.</li>
                        <li>동의 철회: 마이페이지에서 마케팅 동의 등을 철회할 수 있습니다.</li>
                    </ol>
                    <p className="text-gray-700 mt-2">
                        위 권리 행사는 서면, 전화, 이메일 등을 통해서도 가능하며, 회사는 지체 없이 조치하겠습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제7조 (개인정보의 파기)</h2>
                    <p className="text-gray-700 leading-relaxed">
                        회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을
                        때에는 지체없이 해당 개인정보를 파기합니다.
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
                        <li>파기 절차: 이용자의 개인정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 관련 법령에 따라 일정 기간 저장 후 파기됩니다.</li>
                        <li>파기 방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각합니다.</li>
                        <li>계정 삭제 시: 계정 삭제 요청 시 개인정보는 즉시 익명화 처리되며, 관련 데이터는 법정 보존기간 경과 후 파기됩니다.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제8조 (개인정보의 안전성 확보 조치)</h2>
                    <p className="text-gray-700 leading-relaxed">
                        회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
                        <li>비밀번호 암호화: 비밀번호는 bcrypt 알고리즘으로 암호화하여 저장·관리합니다.</li>
                        <li>접근 통제: JWT 기반 인증을 통해 개인정보에 대한 접근을 통제합니다.</li>
                        <li>전송 구간 암호화: 개인정보는 HTTPS를 통해 암호화 전송됩니다.</li>
                        <li>접속 기록 보관: 개인정보처리시스템에 대한 접속기록을 최소 1년 이상 보관·관리합니다.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제9조 (클라이언트 저장소 사용 안내)</h2>
                    <p className="text-gray-700 leading-relaxed">
                        본 서비스는 인증 상태 유지를 위해 브라우저의 로컬 저장소(localStorage) 및 쿠키를
                        사용합니다. 이는 서비스 이용에 필수적이며, 별도의 개인정보를 수집하지 않습니다.
                        제3자 분석 도구나 추적 스크립트는 사용하지 않습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제10조 (개인정보 보호책임자)</h2>
                    <p className="text-gray-700 leading-relaxed">
                        회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 정보주체의 불만처리 및
                        피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                    </p>
                    <div className="mt-2 bg-gray-50 p-4 rounded-lg text-gray-700">
                        <p><strong>개인정보 보호책임자</strong></p>
                        <p>성명: 만실 개인정보보호팀</p>
                        <p>직위: 개인정보 보호책임자</p>
                        <p>연락처: privacy@mansil.com, 02-000-0000</p>
                    </div>
                    <p className="text-gray-700 mt-2">
                        정보주체는 「개인정보 보호법」 제35조에 의한 개인정보의 열람 청구를 위 부서에
                        할 수 있습니다. 또한 개인정보 침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회,
                        한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
                        <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)</li>
                        <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
                        <li>대검찰청: (국번없이) 1301 (www.spo.go.kr)</li>
                        <li>경찰청: (국번없이) 182 (ecrm.cyber.go.kr)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3">제11조 (개인정보 처리방침의 변경)</h2>
                    <p className="text-gray-700 leading-relaxed">
                        이 개인정보 처리방침은 2026년 2월 26일부터 적용됩니다.
                        변경사항이 있는 경우 시행 7일 전부터 플랫폼 공지사항을 통하여 고지할 것입니다.
                        다만, 수집·이용 목적 변경 등 중요한 변경사항이 있을 경우에는 시행 30일 전에 고지합니다.
                    </p>
                </section>
            </div>
        </div>
    );
}
