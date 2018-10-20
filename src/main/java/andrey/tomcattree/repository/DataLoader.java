package andrey.tomcattree.repository;

import andrey.tomcattree.model.Document;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/*
fill db with test data
create 10 folders and 20 files
*/

@Component
public class DataLoader implements ApplicationRunner{

    private final DocumentRepository documentRepository;

    public DataLoader (DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        int FOLDERS_COUNT = 10;
        int FILES_COUNT = 20;
        // Folders
        // auto-generated IDs starts with 1
        for (int i = 1; i <= FOLDERS_COUNT; i++) {
            // random parent ID
            Long parent = (long) (Math.random() * i);

            // create and save new item
            Document document = new Document(parent, "Folder " + i, true);
            documentRepository.save(document);
        }

        // Files
        for (int i = 1; i <= FILES_COUNT; i++) {
            // random parent ID
            Long parent = (long) (Math.random() * FOLDERS_COUNT);

            // create and save new item
            Document document = new Document(parent, "file_" + i, false);
            documentRepository.save(document);
        }
    }
}
