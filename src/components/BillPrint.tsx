import { format } from 'date-fns';

interface BillPrintProps {
  data: any;
  type: 'checkin' | 'checkout';
}

export function BillPrint({ data, type }: BillPrintProps) {
  const isCheckOut = type === 'checkout';

  return (
    <div className="bill-print">
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: '0', fontSize: '14pt' }}>HỒ CÂU KIM THÔNG</h2>
        <p style={{ margin: '0', fontSize: '8pt' }}>Đ/C: Bình Chánh, TP.HCM</p>
        <p style={{ margin: '0', fontSize: '8pt' }}>SĐT: 09xx xxx xxx</p>
        <div style={{ borderBottom: '1px dashed black', margin: '5px 0' }}></div>
        <h3 style={{ margin: '5px 0', fontSize: '12pt' }}>
          {isCheckOut ? 'HÓA ĐƠN THANH TOÁN' : 'VÉ CÂU CÁ'}
        </h3>
      </div>

      <div style={{ fontSize: '9pt', marginBottom: '10px' }}>
        <p style={{ margin: '2px 0' }}>Khách: <strong>{data.customerName}</strong></p>
        {data.phoneNumber && <p style={{ margin: '2px 0' }}>SĐT: {data.phoneNumber}</p>}
        <p style={{ margin: '2px 0' }}>Vào: {format(data.startTime, 'HH:mm dd/MM')}</p>
        {isCheckOut && <p style={{ margin: '2px 0' }}>Ra: {format(data.endTime || new Date(), 'HH:mm dd/MM')}</p>}
        <p style={{ margin: '2px 0' }}>Loại: {data.sessionType === '1h' ? 'Ca 1h' : data.sessionType === '5h' ? 'Ca 5h' : data.sessionType === '10h' ? 'Ca 10h' : 'Linh hoạt'}</p>
      </div>

      <div style={{ borderBottom: '1px dashed black', margin: '5px 0' }}></div>

      {isCheckOut && (
        <div style={{ fontSize: '9pt' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ textAlign: 'left' }}>Mục</th>
                <th style={{ textAlign: 'right' }}>T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tiền giờ</td>
                <td style={{ textAlign: 'right' }}>{(data.timeAmount || 0).toLocaleString()}</td>
              </tr>
              {data.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>{item.name} x{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
              {data.fishWeight > 0 && (
                <tr style={{ color: 'red' }}>
                  <td>Thu cá ({data.fishWeight}kg)</td>
                  <td style={{ textAlign: 'right' }}>-{(data.fishWeight * data.fishPricePerKg).toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div style={{ borderBottom: '1px dashed black', margin: '10px 0' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12pt', fontWeight: 'bold' }}>
            <span>TỔNG CỘNG:</span>
            <span>{(data.totalAmount || 0).toLocaleString()}đ</span>
          </div>
        </div>
      )}

      {!isCheckOut && (
        <div style={{ fontSize: '8pt', fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>
          <p>Chúc quý khách có buổi câu thư giãn!</p>
          <p>Vui lòng giữ vé để thanh toán.</p>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '8pt' }}>
        <p>{format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
      </div>
    </div>
  );
}
