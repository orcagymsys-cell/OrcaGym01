using System;
using System.Text;
class Program {
    static void Main() {
        Encoding cp874 = Encoding.GetEncoding(874);
        for(int i=128; i<=255; i++) {
            byte[] b = new byte[] { (byte)i };
            string s = cp874.GetString(b);
            Console.WriteLine(i + ":" + (int)s[0]);
        }
    }
}
