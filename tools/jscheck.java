import java.io.*;
import org.mozilla.javascript.*;

public class jscheck
{
    /**
     * Attempt to compile JavaScript files we're given,
     * and output success/fail to console.
     */
    public static void main(String args[])
    {
        int failcount = 0;

        // Initialize Rhino JS engine...
        Context cx = Context.enter();
        try {
            for (String filename : args) {
                System.out.print(filename);
                String source;
                try {
                    source = readFileAsString(filename);
                } catch (Exception e) {
                    System.out.println(" READ FAIL: " + e.getMessage());
                    continue;
                }

                // Just try compiling...
                try {
                    cx.compileString(source, filename, 0, null);
                    System.out.println(" OK");
                } catch (Exception e) {
                    System.out.println(" COMPILE FAIL: " + e.getMessage());
                    failcount++;
                }
            }
        } finally {
            // Exit from the context.
            Context.exit();
        }
        if (failcount > 0) {
            System.exit(1);
        }
    }

    static String readFileAsString(String filename)
    throws IOException
    {
        File file = new File(filename);
        int filesize = (int)file.length(); // if your JS source is >2gb, you're doomed
        FileInputStream fis = new FileInputStream(file);
        InputStreamReader in = new InputStreamReader(fis, "UTF-8"); 
        char[] c = new char[filesize];
        in.read(c, 0, filesize);
        return new String(c);
    }
}
